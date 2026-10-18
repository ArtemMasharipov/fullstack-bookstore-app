import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";
import { config } from "../../config/index.js";
import User from "../../models/User.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();

const sessions = () => mongoose.connection.collection("sessions");
const me = (token) => request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
const logout = (token) =>
  request(app).post("/api/v1/auth/logout").set("Authorization", `Bearer ${token}`);

const SESSION_NOT_VALID = { code: "UNAUTHORIZED", message: "Session is not valid" };

// The token signed again with the app's secret, with some claims changed
function forge(token, change = (claims) => claims, options = {}) {
  const { iat, exp, ...claims } = jwt.decode(token);
  return jwt.sign(change(claims), config.jwt.secret, { expiresIn: "1h", ...options });
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

    const claims = jwt.decode(token);
    expect(Object.keys(claims).sort()).toEqual(["aud", "exp", "iat", "iss", "jti", "sub"]);
    expect(claims).toMatchObject({ aud: "bookstore-web", iss: "bookstore-api", sub: user._id.toString() });
    expect(await sessions().countDocuments({ user: user._id })).toBe(1);
    const session = await sessions().findOne({ jti: claims.jti });
    expect(Math.abs(session.expiresAt.getTime() - claims.exp * 1000)).toBeLessThanOrEqual(1000);
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
