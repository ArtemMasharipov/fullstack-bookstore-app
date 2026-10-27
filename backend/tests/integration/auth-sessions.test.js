import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";
import { config } from "../../config/index.js";
import User from "../../models/User.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { decodeJwtFixture, signLegacyToken, verifyJwtFixture } from "../helpers/jwt.js";

useTestDatabase();

const sessions = () => mongoose.connection.collection("sessions");
const me = (token) => request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
const logout = (token) =>
  request(app).post("/api/v1/auth/logout").set("Authorization", `Bearer ${token}`);

const SESSION_NOT_VALID = { code: "UNAUTHORIZED", message: "Session is not valid" };

// The token signed again with the app's secret, with some claims changed
function forge(token, change = (claims) => claims, options = {}) {
  return signLegacyToken(change(decodeJwtFixture(token)), { secret: config.jwt.secret, ...options });
}

describe("sessions", () => {
  it("ends the session of the token on logout: 204, then 401 for the same token", async () => {
    const token = await loginAs(app, await createUser());

    const res = await logout(token);

    expect(res.status).toBe(204);
    expect(res.text).toBe("");
    const after = await me(token);
    expect(after.status).toBe(401);
    expect(after.body.error).toEqual(SESSION_NOT_VALID);
  });

  it("ends only this device's session", async () => {
    const user = await createUser();
    const first = await loginAs(app, user);
    const second = await loginAs(app, user);

    await logout(first);

    expect((await me(second)).status).toBe(200);
  });

  it("stores one session per sign-in that ends when the token does", async () => {
    const user = await createUser();
    const token = await loginAs(app, user);

    const { header, payload: claims } = verifyJwtFixture(token, config.jwt.secret);
    expect(header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(Object.keys(claims).sort()).toEqual(["aud", "exp", "iat", "iss", "jti", "sub"]);
    expect(claims).toMatchObject({ aud: "bookstore-web", iss: "bookstore-api", sub: user._id.toString() });
    expect(await sessions().countDocuments({ user: user._id })).toBe(1);
    const session = await sessions().findOne({ jti: claims.jti });
    expect(session.expiresAt.getTime()).toBe(claims.exp * 1000);
  });

  it("accepts a legacy HS256 session with audience array and no typ requirement", async () => {
    const token = await loginAs(app, await createUser());
    const legacy = forge(token, claims => ({ ...claims, aud: ["other-client", config.jwt.audience] }), { header: { typ: undefined } });
    expect((await me(legacy)).status).toBe(200);
  });

  it.each(["exp", "iat", "both"])("accepts optional %s when the live DB session exists", async omit => {
    const token = await loginAs(app, await createUser());
    const legacy = forge(token, claims => {
      if (omit === "exp" || omit === "both") delete claims.exp;
      if (omit === "iat" || omit === "both") delete claims.iat;
      return claims;
    });
    expect((await me(legacy)).status).toBe(200);
  });

  it("accepts uppercase subject and non-UUID session id", async () => {
    const token = await loginAs(app, await createUser());
    const claims = decodeJwtFixture(token);
    await sessions().updateOne({ jti: claims.jti }, { $set: { jti: "legacy-session" } });
    const legacy = forge(token, old => ({ ...old, sub: old.sub.toUpperCase(), jti: "legacy-session" }));
    expect((await me(legacy)).status).toBe(200);
  });

  it("does not grant admin from a token role claim", async () => {
    const token = forge(await loginAs(app, await createUser()), claims => ({ ...claims, role: "admin" }));
    const response = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it.each([
    ["signed for another audience", (token) => forge(token, (claims) => ({ ...claims, aud: "someone-else" }))],
    ["signed by another issuer", (token) => forge(token, (claims) => ({ ...claims, iss: "someone-else" }))],
    [
      "without a session id",
      (token) =>
        forge(token, ({ jti, ...claims }) => claims),
    ],
    ["signed with another algorithm", (token) => forge(token, undefined, { algorithm: "HS512" })],
    ["signed with another key", token => forge(token, undefined, { secret: "unrelated-test-key" })],
    ["unsigned", token => forge(token, undefined, { algorithm: "none" })],
    ["malformed compact", () => "not.a.valid.jwt"],
    ["malformed JSON", () => "e30.bm90LWpzb24.c2lnbmF0dXJl"],
    ["not active yet", token => forge(token, claims => ({ ...claims, nbf: Math.floor(Date.now() / 1000) + 3600 }))],
    ["with expired JWT and a live DB session", token => forge(token, claims => ({ ...claims, exp: Math.floor(Date.now() / 1000) - 1 }))],
    ["without subject", token => forge(token, ({ sub, ...claims }) => claims)],
    ["with non-string subject", token => forge(token, claims => ({ ...claims, sub: 123 }))],
    ["with invalid object id", token => forge(token, claims => ({ ...claims, sub: "invalid-id" }))],
    ["with non-string session id", token => forge(token, claims => ({ ...claims, jti: 123 }))],
    ["with malformed issued-at claim", token => forge(token, claims => ({ ...claims, iat: "yesterday" }))],
    ["with unsupported critical header", token => forge(token, undefined, { header: { crit: ["unknown"], unknown: true } })],
    [
      "whose session was deleted",
      async (token) => {
        await sessions().deleteMany({});
        return token;
      },
    ],
    [
      "whose session has expired",
      async (token) => {
        await sessions().updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
        return token;
      },
    ],
    [
      "of a deactivated user",
      async (token, user) => {
        await User.updateOne({ _id: user._id }, { $set: { isActive: false } });
        return token;
      },
    ],
    [
      "of a user who no longer exists",
      async (token, user) => {
        await User.deleteOne({ _id: user._id });
        return token;
      },
    ],
  ])("refuses a token %s: 401", async (name, make) => {
    const user = await createUser();
    const token = await make(await loginAs(app, user), user);

    const res = await me(token);

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual(SESSION_NOT_VALID);
  });

  it("takes the role from the database, not from the token", async () => {
    const user = await createUser();
    const token = await loginAs(app, user);
    const users = () => request(app).get("/api/v1/users").set("Authorization", `Bearer ${token}`);

    await User.updateOne({ _id: user._id }, { $set: { role: "admin" } });
    expect((await users()).status).toBe(200);

    await User.updateOne({ _id: user._id }, { $set: { role: "user" } });
    expect((await users()).status).toBe(403);
  });
});
