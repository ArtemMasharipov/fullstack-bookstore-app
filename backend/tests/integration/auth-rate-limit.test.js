import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";
import { errorHandler } from "../../middleware/errorHandler.js";
import { authRateLimit } from "../../middleware/rateLimit.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

// The default limit: 10 failed requests to /auth per client in 15 minutes.
// useTestDatabase() resets the counts after each test.
useTestDatabase();

const LIMIT = 10;

const wrongLogin = (email, headers = {}) =>
  request(app).post("/api/v1/auth/login").set(headers).send({ emailOrUsername: email, password: "wrong-pass" });

describe("failed attempts on /api/v1/auth", () => {
  it("shares the IPv6 /56 limit across client addresses and keeps the adjacent /56 independent", async () => {
    // Only this isolated harness trusts the local Supertest proxy. Exercise the
    // real Express req.ip and production limiter/parser without changing app settings.
    const proxiedApp = express();
    proxiedApp.set("trust proxy", "loopback");
    proxiedApp.use("/api/v1/auth", authRateLimit);
    proxiedApp.post("/api/v1/auth/login", (_req, res) => res.sendStatus(401));
    proxiedApp.use(errorHandler);
    const failFrom = (ip) => request(proxiedApp).post("/api/v1/auth/login").set("X-Forwarded-For", ip);
    const sameSubnet = [
      "2001:db8:1234:ab00::1",
      "2001:0db8:1234:ab00:0000:0000:0000:0001",
      "2001:db8:1234:abff::2",
    ];
    for (let attempt = 0; attempt < LIMIT; attempt += 1) {
      expect((await failFrom(sameSubnet[attempt % sameSubnet.length])).status).toBe(401);
    }

    const blocked = await failFrom("2001:db8:1234:ab80::99");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
    const retryAfter = Number(blocked.headers["retry-after"]);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(900);
    expect(blocked.body.error.details).toEqual({ retryAfter });
    expect((await failFrom("2001:db8:1234:ac00::1")).status).toBe(401);
  });

  it("answers 429 with Retry-After on the 11th failed attempt in the window", async () => {
    const user = await createUser();
    for (let attempt = 0; attempt < LIMIT; attempt += 1) {
      expect((await wrongLogin(user.email)).status).toBe(401);
    }

    const res = await wrongLogin(user.email);

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
    const retryAfter = Number(res.headers["retry-after"]);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(900);
    expect(res.body.error.details).toEqual({ retryAfter });
    expect(res.headers).toHaveProperty("ratelimit");
  });

  it("does not spend the limit on successful requests", async () => {
    const user = await createUser();
    for (let attempt = 0; attempt < 2 * LIMIT; attempt += 1) {
      const token = await loginAs(app, user);
      const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
      expect(me.status).toBe(200);
    }

    expect((await wrongLogin(user.email)).status).toBe(401);
  });

  it("counts failures of every auth endpoint", async () => {
    const user = await createUser();
    for (let attempt = 0; attempt < LIMIT / 2; attempt += 1) {
      const taken = await request(app)
        .post("/api/v1/auth/register")
        .send({ username: `taken${attempt}`, email: user.email, password: "Silver meadow 58!" });
      expect(taken.status).toBe(409);
      expect((await wrongLogin(user.email)).status).toBe(401);
    }

    expect((await wrongLogin(user.email)).status).toBe(429);
  });

  it("still signs out and answers the current user from a blocked address", async () => {
    const user = await createUser();
    const token = await loginAs(app, user);
    for (let attempt = 0; attempt <= LIMIT; attempt += 1) await wrongLogin(user.email);
    expect((await wrongLogin(user.email)).status).toBe(429);
    const me = () => request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);

    expect((await me()).status).toBe(200);
    const out = await request(app).post("/api/v1/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(out.status).toBe(204);
    expect((await me()).status).toBe(401);
  });

  it("keeps counting when the client changes X-Forwarded-For", async () => {
    const user = await createUser();
    for (let attempt = 0; attempt < LIMIT; attempt += 1) {
      expect((await wrongLogin(user.email, { "X-Forwarded-For": `203.0.113.${attempt}` })).status).toBe(401);
    }

    expect((await wrongLogin(user.email, { "X-Forwarded-For": "203.0.113.200" })).status).toBe(429);
  });
});
