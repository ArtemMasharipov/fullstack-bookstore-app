import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";
import User from "../../models/User.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();

const as = (req, token) => req.set("Authorization", `Bearer ${token}`);
const me = (token) => as(request(app).get("/api/v1/auth/me"), token);
const put = (token, id, body) => as(request(app).put(`/api/v1/users/${id}`), token).send(body);
const setStatus = (token, id, isActive) =>
  as(request(app).patch(`/api/v1/users/${id}/status`), token).send({ isActive });
const remove = (token, id) => as(request(app).delete(`/api/v1/users/${id}`), token);
const activeAdmins = () => User.countDocuments({ role: "admin", isActive: true });

async function signedIn(overrides) {
  const user = await createUser(overrides);
  return { user, token: await loginAs(app, user) };
}

describe("ending sessions", () => {
  it("ends every session of a user the admin deactivates", async () => {
    const admin = await signedIn({ role: "admin" });
    const target = await signedIn();

    expect((await setStatus(admin.token, target.user._id, false)).status).toBe(200);
    expect((await me(target.token)).status).toBe(401);

    expect((await setStatus(admin.token, target.user._id, true)).status).toBe(200);
    expect((await me(target.token)).status).toBe(401);
    expect((await me(await loginAs(app, target.user))).status).toBe(200);
  });

  it("ends every session of a user whose role the admin changes", async () => {
    const admin = await signedIn({ role: "admin" });
    const other = await signedIn({ role: "admin" });

    expect((await put(admin.token, other.user._id, { role: "user" })).status).toBe(200);

    expect((await me(other.token)).status).toBe(401);
    const again = await loginAs(app, other.user);
    expect((await as(request(app).get("/api/v1/users"), again)).status).toBe(403);
  });

  it("keeps the sessions when the admin changes only the name", async () => {
    const admin = await signedIn({ role: "admin" });
    const target = await signedIn();

    expect((await put(admin.token, target.user._id, { firstName: "Jana" })).status).toBe(200);

    expect((await me(target.token)).status).toBe(200);
  });

  it.each([
    ["PUT with isActive: false", (token, id) => put(token, id, { isActive: false })],
    ["DELETE", (token, id) => remove(token, id)],
  ])("ends the sessions of a user deactivated by %s", async (name, deactivate) => {
    const admin = await signedIn({ role: "admin" });
    const target = await signedIn();

    expect((await deactivate(admin.token, target.user._id)).status).toBe(200);

    expect((await me(target.token)).status).toBe(401);
  });
});

describe("an admin's own access", () => {
  it("refuses to take the admin role from oneself", async () => {
    const admin = await signedIn({ role: "admin" });
    await signedIn({ role: "admin" });

    const res = await put(admin.token, admin.user._id, { role: "user" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ADMIN_SELF_CHANGE");
    expect((await User.findById(admin.user._id)).role).toBe("admin");
    expect((await me(admin.token)).status).toBe(200);
  });

  it.each([
    ["PATCH status", (token, id) => setStatus(token, id, false)],
    ["PUT with isActive: false", (token, id) => put(token, id, { isActive: false })],
    ["DELETE", (token, id) => remove(token, id)],
  ])("refuses to deactivate oneself by %s", async (name, deactivate) => {
    const admin = await signedIn({ role: "admin" });
    await signedIn({ role: "admin" });

    const res = await deactivate(admin.token, admin.user._id);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ADMIN_SELF_CHANGE");
    expect((await User.findById(admin.user._id)).isActive).toBe(true);
  });

  // A form-encoded body sends "false" as a string, which Mongoose would store as false
  it.each([["false"], ["0"], [0], [null]])(
    "refuses an isActive of %j that is not true or false: 400, nothing changes",
    async (isActive) => {
      const admin = await signedIn({ role: "admin" });
      const target = await signedIn();

      const own = await put(admin.token, admin.user._id, { isActive });
      const other = await put(admin.token, target.user._id, { isActive });

      for (const res of [own, other]) {
        expect(res.status).toBe(400);
        expect(res.body.error).toMatchObject({
          code: "VALIDATION_FAILED",
          fields: { isActive: "invalid_type" },
        });
      }
      expect(await activeAdmins()).toBe(1);
      expect((await User.findById(target.user._id)).isActive).toBe(true);
    }
  );

  it("refuses a form-encoded isActive=false for one's own account", async () => {
    const admin = await signedIn({ role: "admin" });

    const res = await as(request(app).put(`/api/v1/users/${admin.user._id}`), admin.token)
      .type("form")
      .send("isActive=false");

    expect(res.status).toBe(400);
    expect(await activeAdmins()).toBe(1);
  });

  it("lets an admin change their own name", async () => {
    const admin = await signedIn({ role: "admin" });

    expect((await put(admin.token, admin.user._id, { firstName: "Eva" })).status).toBe(200);
  });
});

describe("the last active admin", () => {
  // Two admins who take each other's access at the same moment: whatever the
  // order the requests run in, the shop keeps an active admin
  it.each([
    ["demote", (token, id) => put(token, id, { role: "user" })],
    ["deactivate", (token, id) => setStatus(token, id, false)],
  ])("never leaves the shop without an active admin when two admins %s each other at once", async (name, change) => {
    for (let round = 0; round < 5; round += 1) {
      await mongoose.connection.collection("users").deleteMany({});
      await mongoose.connection.collection("sessions").deleteMany({});
      const a = await signedIn({ role: "admin" });
      const b = await signedIn({ role: "admin" });

      const answers = await Promise.all([change(a.token, b.user._id), change(b.token, a.user._id)]);

      const statuses = answers.map((res) => res.status);
      expect(statuses).not.toEqual([200, 200]);
      expect(await activeAdmins()).toBeGreaterThanOrEqual(1);
      for (const res of answers.filter((answer) => answer.status !== 200)) {
        if (res.status === 409) expect(res.body.error.code).toBe("LAST_ADMIN");
        else expect([401, 403]).toContain(res.status);
      }
    }
  });
});
