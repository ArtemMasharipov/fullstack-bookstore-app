import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import User from "../../models/User.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();

let token;
let target;
beforeEach(async () => {
  token = await loginAs(app, await createUser({ role: "admin" }));
  target = await createUser({ firstName: "Jan", lastName: "Novák" });
});

const stored = () => User.findById(target._id).select("username email firstName lastName role isActive updatedAt").lean();
const send = (method, path, body) => request(app)[method](path)
  .set("Authorization", `Bearer ${token}`).set("Content-Type", "application/json").send(body);

describe("strict user updates", () => {
  it.each([
    ["password", { password: "another-secret" }],
    ["isActive", { isActive: false }],
    ["$set", { $set: { role: "admin" } }],
    ["extra", { extra: true, firstName: "Changed" }],
    ["role", { role: { $ne: "user" } }],
    ["username", { username: ["newname"] }],
    ["email", { email: null }],
    ["firstName", { firstName: 1 }],
    ["lastName", { lastName: null }],
  ])("rejects an invalid %s without writing any fields", async (field, body) => {
    const before = await stored();
    const res = await send("put", `/api/v1/users/${target._id}`, body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(res.body.error.fields).toHaveProperty([field]);
    expect(await stored()).toEqual(before);
  });

  it("rejects a raw prototype field", async () => {
    const before = await stored();
    const res = await send("put", `/api/v1/users/${target._id}`,
      '{"__proto__":{"role":"admin"},"firstName":"Changed"}');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(await stored()).toEqual(before);
    expect({}.role).toBeUndefined();
  });

  it.each(["false", "0", 0, 1, null, {}, []])("rejects a status of %j instead of a boolean", async (isActive) => {
    const before = await stored();
    const res = await send("patch", `/api/v1/users/${target._id}/status`, { isActive });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: "VALIDATION_FAILED", fields: { isActive: "invalid_type" } });
    expect(await stored()).toEqual(before);
  });

  it("rejects an unknown status field even when the boolean is valid", async () => {
    const before = await stored();
    const res = await send("patch", `/api/v1/users/${target._id}/status`, { isActive: false, role: "admin" });
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty(["role"]);
    expect(await stored()).toEqual(before);
  });

  it("does not coerce form-encoded status false", async () => {
    const res = await request(app).patch(`/api/v1/users/${target._id}/status`)
      .set("Authorization", `Bearer ${token}`).type("form").send("isActive=false");
    expect(res.status).toBe(400);
    expect((await stored()).isActive).toBe(true);
  });

  it.each(["put", "patch"])("validates the %s id and rejects unknown query parameters", async (method) => {
    const suffix = method === "patch" ? "/status" : "";
    const body = method === "patch" ? { isActive: true } : { firstName: "Changed" };
    for (const path of [`bad${suffix}`, `${target._id}${suffix}?extra=1`, `${target._id}${suffix}?extra=1&extra=2`]) {
      const res = await send(method, `/api/v1/users/${path}`, body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_FAILED");
      expect(res.body.error.fields).toHaveProperty([path.startsWith("bad") ? "id" : "extra"]);
    }
    expect((await stored()).firstName).toBe("Jan");
  });
});
