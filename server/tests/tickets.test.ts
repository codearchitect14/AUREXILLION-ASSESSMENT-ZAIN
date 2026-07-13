import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createAuthedApp } from "./helpers.js";

const validTicket = {
  title: "Unable to complete payment",
  description: "The customer receives an error after submitting the payment form.",
  customerName: "Jane Smith",
  customerEmail: "jane@example.com",
  priority: "high",
};

let app: Express;
let token: string;

const auth = () => ({ Authorization: `Bearer ${token}` });

beforeEach(async () => {
  ({ app, token } = await createAuthedApp());
});

describe("POST /api/tickets", () => {
  it("creates a valid ticket with status open and persists it", async () => {
    const createRes = await request(app).post("/api/tickets").set(auth()).send(validTicket);

    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject({ ...validTicket, status: "open" });
    expect(createRes.body.id).toBeGreaterThan(0);
    expect(createRes.body.createdAt).toBeTruthy();

    const getRes = await request(app).get(`/api/tickets/${createRes.body.id}`).set(auth());
    expect(getRes.status).toBe(200);
    expect(getRes.body.title).toBe(validTicket.title);
  });

  it("rejects a ticket without a title", async () => {
    const { title, ...withoutTitle } = validTicket;
    const res = await request(app).post("/api/tickets").set(auth()).send(withoutTitle);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "title" })])
    );
  });

  it("rejects a ticket with an invalid email", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set(auth())
      .send({ ...validTicket, customerEmail: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "customerEmail" })])
    );
  });
});

describe("PATCH /api/tickets/:id", () => {
  it("saves a status update", async () => {
    const created = await request(app).post("/api/tickets").set(auth()).send(validTicket);

    const patchRes = await request(app)
      .patch(`/api/tickets/${created.body.id}`)
      .set(auth())
      .send({ status: "in_progress" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe("in_progress");

    const getRes = await request(app).get(`/api/tickets/${created.body.id}`).set(auth());
    expect(getRes.body.status).toBe("in_progress");
  });

  it("rejects an invalid status value", async () => {
    const created = await request(app).post("/api/tickets").set(auth()).send(validTicket);

    const res = await request(app)
      .patch(`/api/tickets/${created.body.id}`)
      .set(auth())
      .send({ status: "closed" });

    expect(res.status).toBe(400);
  });

  it("returns 404 for a missing ticket", async () => {
    const res = await request(app)
      .patch("/api/tickets/9999")
      .set(auth())
      .send({ status: "resolved" });
    expect(res.status).toBe(404);
  });

  it("rejects resolving an open ticket (only in_progress can be resolved)", async () => {
    const created = await request(app).post("/api/tickets").set(auth()).send(validTicket);

    const res = await request(app)
      .patch(`/api/tickets/${created.body.id}`)
      .set(auth())
      .send({ status: "resolved" });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("Only tickets that are in progress can be resolved");

    const unchanged = await request(app).get(`/api/tickets/${created.body.id}`).set(auth());
    expect(unchanged.body.status).toBe("open");
  });

  it("allows resolving a ticket that is in progress", async () => {
    const created = await request(app).post("/api/tickets").set(auth()).send(validTicket);
    await request(app)
      .patch(`/api/tickets/${created.body.id}`)
      .set(auth())
      .send({ status: "in_progress" });

    const res = await request(app)
      .patch(`/api/tickets/${created.body.id}`)
      .set(auth())
      .send({ status: "resolved" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("resolved");
  });
});

describe("GET /api/tickets", () => {
  it("filters tickets by status and priority", async () => {
    await request(app).post("/api/tickets").set(auth()).send(validTicket);
    const second = await request(app)
      .post("/api/tickets")
      .set(auth())
      .send({ ...validTicket, title: "Second ticket", priority: "low" });
    // Resolve via the allowed workflow: open -> in_progress -> resolved.
    await request(app)
      .patch(`/api/tickets/${second.body.id}`)
      .set(auth())
      .send({ status: "in_progress" });
    await request(app)
      .patch(`/api/tickets/${second.body.id}`)
      .set(auth())
      .send({ status: "resolved" });

    const byStatus = await request(app).get("/api/tickets?status=resolved").set(auth());
    expect(byStatus.status).toBe(200);
    expect(byStatus.body).toHaveLength(1);
    expect(byStatus.body[0].title).toBe("Second ticket");

    const byPriority = await request(app).get("/api/tickets?priority=high").set(auth());
    expect(byPriority.body).toHaveLength(1);
    expect(byPriority.body[0].priority).toBe("high");

    const invalid = await request(app).get("/api/tickets?status=bogus").set(auth());
    expect(invalid.status).toBe(400);
  });
});
