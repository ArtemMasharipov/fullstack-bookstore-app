import { performance } from "node:perf_hooks";
import { argon2Sync } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";
import User from "../../models/User.js";
import { resetAuthRateLimit } from "../../middleware/rateLimit.js";
import { createUser } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

// A sign-in must not tell by its time whether an account exists or is active
useTestDatabase();

const ROUNDS = 20;

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function timedLogin(emailOrUsername, password) {
  await resetAuthRateLimit();
  const started = performance.now();
  const res = await request(app).post("/api/v1/auth/login").send({ emailOrUsername, password });
  return { res, ms: performance.now() - started };
}

describe("sign-in time", () => {
  it(
    "answers unknown, inactive and known accounts uniformly with mixed stored hash formats",
    async () => {
      const known = await createUser();
      const inactive = await createUser({ isActive: false });
      const legacy = await createUser();
      const inactiveLegacy = await createUser({ isActive: false });
      // Independent native fixture: the HTTP boundary must handle both formats
      // even before the model starts generating the new one.
      const salt = Buffer.alloc(16, 7);
      const tag = argon2Sync("argon2id", { message: "secret123", nonce: salt, memory: 19456, passes: 2, parallelism: 1, tagLength: 32 });
      const phc = "$argon2id$v=19$m=19456,t=2,p=1$" + salt.toString("base64").replace(/=+$/, "") + "$" + tag.toString("base64").replace(/=+$/, "");
      const bcrypt = "$2b$10$MPbgVxQ8zfl/WU2Q6GCTJOaN7G3JmLurBXQ9jN08fiqIpmpHXTnyy";
      await User.updateOne({ _id: known._id }, { $set: { password: phc } });
      await User.updateOne({ _id: inactive._id }, { $set: { password: phc } });
      await User.updateOne({ _id: legacy._id }, { $set: { password: bcrypt } });
      await User.updateOne({ _id: inactiveLegacy._id }, { $set: { password: bcrypt } });
      const accounts = {
        known: known.email,
        unknown: "nobody@example.com",
        inactive: inactive.email,
        legacy: legacy.email,
        inactiveLegacy: inactiveLegacy.email,
      };
      const times = Object.fromEntries(Object.keys(accounts).map((kind) => [kind, []]));
      const bodies = new Set();

      // Two rounds to warm up, then the measured ones, the three kinds in turn
      for (let round = 0; round < ROUNDS + 2; round += 1) {
        for (const [kind, email] of Object.entries(accounts)) {
          const { res, ms } = await timedLogin(email, "wrong-pass");
          expect(res.status).toBe(401);
          bodies.add(JSON.stringify(res.body));
          if (round >= 2) times[kind].push(ms);
        }
      }

      expect(bodies.size).toBe(1);
      const medians = Object.fromEntries(Object.entries(times).map(([kind, ms]) => [kind, median(ms)]));
      const values = Object.values(medians);
      console.info("Sign-in medians (ms):", JSON.stringify(medians));
      expect(Math.max(...values) - Math.min(...values), JSON.stringify(medians)).toBeLessThan(10);
    },
    60000
  );

  it("refuses an inactive account with the right password: 401 Invalid credentials", async () => {
    const inactive = await createUser({ isActive: false });

    const { res } = await timedLogin(inactive.email, "secret123");

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: "UNAUTHORIZED", message: "Invalid credentials" });
  });
});
