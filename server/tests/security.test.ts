import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createAuthedApp } from "./helpers.js";

const validTicket = {
  title: "Security test ticket",
  description: "Created by the security test suite.",
  customerName: "Sec Tester",
  customerEmail: "sec@example.com",
  priority: "low",
};

let app: Express;
let token: string;

const auth = () => ({ Authorization: `Bearer ${token}` });

beforeEach(async () => {
  ({ app, token } = await createAuthedApp());
});

describe("security headers", () => {
  it("sets helmet headers and hides x-powered-by", async () => {
    const res = await request(app).get("/api/tickets").set(auth());

    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  it("only allows configured CORS origins", async () => {
    const allowed = await request(app)
      .get("/api/tickets")
      .set(auth())
      .set("Origin", "http://localhost:5173");
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");

    const blocked = await request(app)
      .get("/api/tickets")
      .set(auth())
      .set("Origin", "https://evil.example.com");
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("input hardening", () => {
  it("rejects unknown fields (mass assignment protection)", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set(auth())
      .send({ ...validTicket, isAdmin: true });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining("isAdmin") }),
      ])
    );
  });

  it("does not allow status to be set on creation", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set(auth())
      .send({ ...validTicket, status: "resolved" });

    expect(res.status).toBe(400);
  });

  it("stores script-like input as inert text (no execution server-side, escaped by React)", async () => {
    const payload = { ...validTicket, title: '<script>alert("xss")</script>' };
    const res = await request(app).post("/api/tickets").set(auth()).send(payload);

    expect(res.status).toBe(201);
    // Stored verbatim; JSON response + React text rendering keep it inert.
    expect(res.body.title).toBe(payload.title);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  it("rejects oversized JSON bodies with 413", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set(auth())
      .send({ ...validTicket, description: "x".repeat(50_000) });

    expect(res.status).toBe(413);
    expect(res.body.error).toBe("Request body too large");
  });
});

describe("SQL injection", () => {
  it("stores classic injection payloads as inert text without touching other rows", async () => {
    const victim = await request(app).post("/api/tickets").set(auth()).send(validTicket);

    const injectionTitle = "'; DROP TABLE tickets; --";
    const res = await request(app)
      .post("/api/tickets")
      .set(auth())
      .send({
        ...validTicket,
        title: injectionTitle,
        customerName: "Robert'); DELETE FROM tickets; --",
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(injectionTitle);

    // Table still exists and the victim row is untouched.
    const all = await request(app).get("/api/tickets").set(auth());
    expect(all.status).toBe(200);
    expect(all.body).toHaveLength(2);
    const untouched = await request(app).get(`/api/tickets/${victim.body.id}`).set(auth());
    expect(untouched.status).toBe(200);
  });

  it("neutralizes injection attempts via update values", async () => {
    const created = await request(app).post("/api/tickets").set(auth()).send(validTicket);

    const res = await request(app)
      .patch(`/api/tickets/${created.body.id}`)
      .set(auth())
      .send({ title: "x' WHERE 1=1; UPDATE tickets SET status='resolved" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("x' WHERE 1=1; UPDATE tickets SET status='resolved");
    expect(res.body.status).toBe("open");
  });

  it("rejects injection attempts in the id param and filter query", async () => {
    const idAttempt = await request(app).get("/api/tickets/1%20OR%201=1").set(auth());
    expect(idAttempt.status).toBe(400);

    const filterAttempt = await request(app)
      .get(`/api/tickets?status=${encodeURIComponent("open' OR '1'='1")}`)
      .set(auth());
    expect(filterAttempt.status).toBe(400);
  });
});

describe("rate limiting", () => {
  it("returns 429 once the write limit is exceeded", async () => {
    const { app: limitedApp, token: limitedToken } = await createAuthedApp({
      rateLimit: { windowMs: 60_000, max: 100, writeMax: 3, loginMax: 20 },
    });
    const limitedAuth = { Authorization: `Bearer ${limitedToken}` };

    // The login in createAuthedApp consumed 1 of the 3 writes.
    const first = await request(limitedApp).post("/api/tickets").set(limitedAuth).send(validTicket);
    const second = await request(limitedApp)
      .post("/api/tickets")
      .set(limitedAuth)
      .send(validTicket);
    const third = await request(limitedApp).post("/api/tickets").set(limitedAuth).send(validTicket);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(third.status).toBe(429);
    expect(third.body.error).toMatch(/too many requests/i);
  });

  it("rate limits login attempts (brute-force protection)", async () => {
    const { app: limitedApp } = await createAuthedApp({
      rateLimit: { windowMs: 60_000, max: 100, writeMax: 100, loginMax: 3 },
    });

    // The setup login consumed 1 of the 3 allowed attempts.
    const attempt = () =>
      request(limitedApp)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "wrong" });

    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });
});
