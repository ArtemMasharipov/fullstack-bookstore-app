/**
 * Test auth helpers
 * createUser() saves a valid user through the model, so the pre-save hook
 * hashes the password. loginAs() logs that user in through the login endpoint
 * and returns the token.
 */

import request from "supertest";
import User from "../../models/User.js";

let userCounter = 0;

export async function createUser({
  role = "user",
  password = "secret123",
  ...overrides
} = {}) {
  userCounter += 1;

  return User.create({
    username: `user${userCounter}`,
    email: `user${userCounter}@example.com`,
    password,
    role,
    ...overrides,
  });
}

export async function loginAs(app, user, password = "secret123") {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ emailOrUsername: user.email, password });

  return response.body.data.token;
}
