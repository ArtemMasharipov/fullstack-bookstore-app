import { performance } from "node:perf_hooks";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";
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
    "answers an unknown, an inactive and a known account in the same time",
    async () => {
      const known = await createUser();
      const inactive = await createUser({ isActive: false });
      const accounts = {
        known: known.email,
        unknown: "nobody@example.com",
        inactive: inactive.email,
      };
      const times = { known: [], unknown: [], inactive: [] };
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
