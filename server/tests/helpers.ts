import request from "supertest";
import type { Express } from "express";
import { createApp, type AppOptions } from "../src/app.js";
import { createDb } from "../src/db/index.js";
import { UserRepository } from "../src/repositories/userRepository.js";
import { hashPassword } from "../src/utils/password.js";

export const TEST_USER = {
  name: "Test Agent",
  email: "test@example.com",
  password: "Password123!",
};

export interface AuthedApp {
  app: Express;
  token: string;
}

/** Creates an in-memory app with one seeded user and returns a valid JWT for them. */
export async function createAuthedApp(options?: AppOptions): Promise<AuthedApp> {
  const db = createDb(":memory:");
  const app = createApp(db, options);

  new UserRepository(db).create({
    name: TEST_USER.name,
    email: TEST_USER.email,
    passwordHash: hashPassword(TEST_USER.password),
  });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: TEST_USER.email, password: TEST_USER.password });

  return { app, token: res.body.token as string };
}
