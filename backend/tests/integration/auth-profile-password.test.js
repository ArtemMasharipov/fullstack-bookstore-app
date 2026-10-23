import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { config } from "../../config/index.js";
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

describe("profile and account session contracts", () => {
  it("rejects an effectively unchanged normalized password without ending the session", async () => {
    const user = await createUser({ password: GOOD });
    const token = await issueToken(user._id);
    const response = await request(app).put("/api/v1/auth/password").set("Authorization", "Bearer " + token)
      .send({ currentPassword: GOOD, newPassword: "Ｃｅｄａｒ lantern 47!" });
    expect(response.status).toBe(400);
    expect(response.body.error.fields).toEqual({ newPassword: "same_as_current" });
    expect((await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer " + token)).status).toBe(200);
  });

  it.each(["user", "admin"])("revokes every %s session and preserves other accounts", async role => {
    const user = await createUser({ role });
    const other = await createUser();
    const first = await issueToken(user._id), second = await issueToken(user._id), otherToken = await issueToken(other._id);
    const response = await request(app).delete("/api/v1/auth/sessions").set("Authorization", "Bearer " + first);
    expect(response.status).toBe(204);
    expect(response.text).toBe("");
    expect(await Session.countDocuments({ user: user._id })).toBe(0);
    for (const token of [first, second]) expect((await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer " + token)).status).toBe(401);
    expect((await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer " + otherToken)).status).toBe(200);
    expect((await User.findById(user._id)).role).toBe(role);
  });

  it.each(["profile", "password", "sessions"])("requires authentication before validating %s", async endpoint => {
    const call = endpoint === "sessions" ? request(app).delete("/api/v1/auth/sessions") : request(app).put("/api/v1/auth/" + endpoint);
    expect((await call.send({ unknown: true })).status).toBe(401);
  });

  it.each([{ email: "other@example.com" }, { role: "admin" }, { password: GOOD }, { phone: "123" }, { firstName: "x".repeat(51) }, { username: "bad name" }, [], null])("rejects invalid profile data without persisting: %j", async body => {
    const user = await createUser({ firstName: "Original" }), token = await issueToken(user._id);
    const call = request(app).put("/api/v1/auth/profile").set("Authorization", "Bearer " + token);
    const response = body === null ? await call.set("Content-Type", "application/json").send("null") : await call.send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_FAILED");
    expect((await User.findById(user._id)).firstName).toBe("Original");
  });

  it("persists all profile fields with the shared user view", async () => {
    const user = await createUser(), token = await issueToken(user._id);
    const response = await request(app).put("/api/v1/auth/profile").set("Authorization", "Bearer " + token)
      .send({ username: "new_profile", firstName: " Jana ", lastName: " Novák " });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ username: "new_profile", firstName: "Jana", lastName: "Novák", email: user.email, role: "user" });
    expect(response.body.data).not.toHaveProperty("_id");
    expect(response.body.data).not.toHaveProperty("__v");
    expect(response.body.data).not.toHaveProperty("password");
    expect((await User.findById(user._id)).username).toBe("new_profile");
  });

  it("rejects unknown logout-all body and query keys without ending sessions", async () => {
    const user = await createUser(), token = await issueToken(user._id);
    for (const [path, body] of [["/api/v1/auth/sessions", { all: true }], ["/api/v1/auth/sessions?user=other", {}]]) {
      const response = await request(app).delete(path).set("Authorization", "Bearer " + token).send(body);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_FAILED");
      expect((await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer " + token)).status).toBe(200);
    }
  });

  it("allows logout-all after the failed-auth limit is exhausted", async () => {
    const user = await createUser(), token = await issueToken(user._id);
    let last;
    for (let attempt = 0; attempt <= config.authRateLimit.max; attempt += 1) last = await login("unknown@example.com", "wrong");
    expect(last.status).toBe(429);
    expect((await request(app).delete("/api/v1/auth/sessions").set("Authorization", "Bearer " + token)).status).toBe(204);
  });
});
