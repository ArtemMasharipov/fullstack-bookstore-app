import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import User from "../../models/User.js";
import Session from "../../models/Session.js";
import { resetAuthRateLimit } from "../../middleware/rateLimit.js";
import { issueToken } from "../../services/sessions.js";
import { seed } from "../../scripts/seed.js";
import { createUser } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();
beforeEach(() => resetAuthRateLimit());
const GOOD = "Cedar lantern 47!";
const account = { username: "policy_account", email: "policy.account@example.com" };
const counts = async () => ({ users: await User.countDocuments(), sessions: await Session.countDocuments() });
const login = (email, password) => request(app).post("/api/v1/auth/login").send({ emailOrUsername: email, password });
const cases = [
  ["14 codepoints", "a".repeat(14), "too_small"],
  ["common password", "123456789012345", "common"],
  ["username", "Trail POLICY_ACCOUNT moon 47!", "context"],
  ["email local part", "Trail POLICY.ACCOUNT moon 47!", "context"],
  ["service name", "Trail BOOKSTORE moon 47!", "context"],
  ["129 codepoints", "x".repeat(129), "too_big"],
];

for (const boundary of ["register", "admin-create", "password"]) {
  describe("password policy at " + boundary, () => {
    async function submit(password) {
      if (boundary === "register") return request(app).post("/api/v1/auth/register").send({ ...account, password });
      const user = await createUser(boundary === "password" ? { ...account, password: GOOD } : { role: "admin" });
      const token = await issueToken(user._id);
      const before = await counts();
      const response = boundary === "password"
        ? await request(app).put("/api/v1/auth/password").set("Authorization", "Bearer " + token).send({ currentPassword: GOOD, newPassword: password })
        : await request(app).post("/api/v1/users").set("Authorization", "Bearer " + token).send({ ...account, password, role: "user" });
      return { response, before, token };
    }

    it.each(cases)("rejects %s on the password field without creating sessions or accounts", async (_name, password, code) => {
      const beforePublic = await counts();
      const sent = await submit(password);
      const response = boundary === "register" ? sent : sent.response;
      const before = boundary === "register" ? beforePublic : sent.before;
      expect(response.status).toBe(400);
      expect(response.body.error).toMatchObject({ code: "VALIDATION_FAILED", fields: { [boundary === "password" ? "newPassword" : "password"]: code } });
      expect(await counts()).toEqual(before);
      if (sent.token) expect((await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer " + sent.token)).status).toBe(200);
    });

    it.each([15, 64, 128])("accepts %i normalized codepoints and verifies the full password", async (length) => {
      const password = "Cedar 47! moon?".padEnd(length, "x");
      const sent = await submit(password);
      const response = boundary === "register" ? sent : sent.response;
      expect(response.status).toBe(boundary === "password" ? 200 : 201);
      const user = response.body.data.user ?? response.body.data;
      expect((await login(user.email, password)).status).toBe(200);
      expect(user).not.toHaveProperty("password");
      expect(user).not.toHaveProperty("__v");
    });
  });
}

describe("seed password validation precedes every write and deletion", () => {
  it.each(["a".repeat(14), "123456789012345", "Trail BOOKSTORE moon 47!", "x".repeat(129)])("rejects an invalid second password before writing: %j", async (password) => {
    let failure;
    try { await seed({ adminPassword: GOOD, userPassword: password }); } catch (error) { failure = error; }
    expect(await User.countDocuments()).toBe(0);
    expect(failure).toMatchObject({ code: "VALIDATION_FAILED" });
    expect(failure.message).not.toContain(password);
  });

  it("does not reset existing users when the second password is invalid", async () => {
    await seed({ adminPassword: GOOD, userPassword: "Velvet compass 92!" });
    const ids = (await User.find().sort("_id")).map(user => String(user._id));
    await seed({ adminPassword: GOOD, userPassword: "Trail READER moon 47!", reset: true }).catch(() => {});
    expect((await User.find().sort("_id")).map(user => String(user._id))).toEqual(ids);
  });
});
