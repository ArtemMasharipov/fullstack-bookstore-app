import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

// Characterization tests: they record the correct behavior the API has today
// and are the safety net for the backend refactoring. They must not pin defects.
useTestDatabase();

const alice = {
  username: "alice",
  email: "alice@example.com",
  password: "secret123",
};

const registerAlice = () =>
  request(app).post("/api/v1/auth/register").send(alice);

describe("health", () => {
  it("GET /api/v1/health answers 200 and reports the API is running", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("API is running");
  });
});

describe("auth", () => {
  it("registers a user: 201, a token and the user role", async () => {
    const res = await registerAlice();

    expect(res.status).toBe(201);
    expect(typeof res.body.data.token).toBe("string");
    expect(res.body.data.user.role).toBe("user");
  });

  it("rejects login with a wrong password: 401 Invalid credentials", async () => {
    await registerAlice();

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ emailOrUsername: alice.email, password: "wrong-pass" });

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({
      code: "UNAUTHORIZED",
      message: "Invalid credentials",
    });
  });

  it("GET /api/v1/auth/me without a token answers 401", async () => {
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
  });

  it("GET /api/v1/auth/me with the registration token answers 200", async () => {
    const registered = await registerAlice();

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${registered.body.data.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(alice.username);
  });
});

describe("books", () => {
  it("GET /api/v1/books answers 200 with a list and pagination", async () => {
    const res = await request(app).get("/api/v1/books");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toEqual(
      expect.objectContaining({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        pages: expect.any(Number),
      })
    );
  });

  it("GET /api/v1/books/:id answers 400 VALIDATION_FAILED for a malformed id", async () => {
    const res = await request(app).get("/api/v1/books/not-an-id");

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({
      code: "VALIDATION_FAILED",
      message: "Validation failed",
      fields: { id: "invalid_format" },
    });
  });

  it("GET /api/v1/books/:id answers 404 for a well-formed id that does not exist", async () => {
    const id = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/v1/books/${id}`);

    expect(res.status).toBe(404);
  });

  it("POST /api/v1/books without a token answers 401", async () => {
    const res = await request(app).post("/api/v1/books");

    expect(res.status).toBe(401);
  });

  it("POST /api/v1/books with a regular user token answers 403", async () => {
    const user = await createUser();
    const token = await loginAs(app, user);

    const res = await request(app)
      .post("/api/v1/books")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
