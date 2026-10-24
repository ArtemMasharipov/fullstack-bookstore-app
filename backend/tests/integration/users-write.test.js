import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import User from "../../models/User.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();
const KEYS = ["id", "username", "email", "firstName", "lastName", "role", "isActive", "lastLogin", "createdAt"].sort();
let token, person;
beforeEach(async () => {
  token = await loginAs(app, await createUser({ role: "admin" }));
  person = await createUser({ firstName: "Jan", lastName: "Novák" });
});
const send = (method, path, body) => request(app)[method](`/api/v1/users${path}`).set("Authorization", `Bearer ${token}`).send(body);
const newUser = { username: "new_user", email: "new@example.com", password: "Silver meadow 58!", role: "user" };
const contract = (res, status) => {
  expect(res.status).toBe(status);
  expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
  expect(Object.keys(res.body.data).sort()).toEqual(KEYS);
};

describe("admin user writes", () => {
  it("creates and edits a user through one explicit DTO", async () => {
    const created = await send("post", "", { ...newUser, username: " new_user ", email: " NEW@EXAMPLE.COM " });
    contract(created, 201);
    expect(created.body.data).toMatchObject({ username: "new_user", email: "new@example.com", firstName: null, lastName: null, role: "user", isActive: true, lastLogin: null });
    const updated = await send("put", `/${person._id}`, { firstName: " Jana " });
    contract(updated, 200);
    expect(updated.body.data).toMatchObject({ firstName: "Jana", lastName: "Novák", username: person.username, email: person.email });
    contract(await send("put", `/${person._id}`, {}), 200);
    expect((await send("put", `/${person._id}`, { firstName: "" })).body.data.firstName).toBe("");
    const status = await send("patch", `/${person._id}/status`, { isActive: false });
    contract(status, 200);
    expect(status.body.data.isActive).toBe(false);
  });

  it.each([
    ["password", { ...newUser, password: "12345" }],
    ["role", { username: "new_user", email: "new@example.com", password: "Silver meadow 58!" }],
    ["role", { ...newUser, role: { $ne: "user" } }],
    ["isActive", { ...newUser, isActive: false }],
    ["email", { ...newUser, email: "new@example..com" }],
    ["firstName", { ...newUser, firstName: null }],
  ])("rejects invalid create field %s before storing a user", async (field, body) => {
    const before = await User.countDocuments();
    const res = await send("post", "", body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(res.body.error.fields).toHaveProperty([field]);
    expect(await User.countDocuments()).toBe(before);
  });

  it.each(["username", "email"])("reports a duplicate %s on create and partial update", async (field) => {
    const created = await send("post", "", { ...newUser, [field]: person[field] });
    expect(created.status).toBe(409);
    expect(created.body.error).toMatchObject({ code: "CONFLICT", fields: { [field]: "duplicate" } });
    const other = await createUser();
    const updated = await send("put", `/${person._id}`, { [field]: other[field], firstName: "Rejected" });
    expect(updated.status).toBe(409);
    expect(updated.body.error).toMatchObject({ code: "CONFLICT", fields: { [field]: "duplicate" } });
    expect((await User.findById(person._id)).firstName).toBe("Jan");
  });

  it.each(["username", "email"])("checks a conflicting %s even when both identities are changed", async (field) => {
    const other = await createUser();
    const body = { username: "available", email: "available@example.com", [field]: other[field], firstName: "Rejected" };
    const res = await send("put", `/${person._id}`, body);
    expect(res.status).toBe(409);
    expect(res.body.error.fields).toEqual({ [field]: "duplicate" });
    const saved = await User.findById(person._id);
    expect(saved.username).toBe(person.username);
    expect(saved.email).toBe(person.email);
    expect(saved.firstName).toBe("Jan");
  });

  it("settles parallel duplicate creations with one success and a field conflict", async () => {
    const answers = await Promise.all([send("post", "", newUser), send("post", "", newUser)]);
    expect(answers.map((res) => res.status).sort()).toEqual([201, 409]);
    expect(answers.find((res) => res.status === 409).body.error.code).toBe("CONFLICT");
    expect(await User.countDocuments({ username: "new_user" })).toBe(1);
  });
});
