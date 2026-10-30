import bcrypt from "bcrypt";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";
import User from "../../models/User.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();

const USER_KEYS = [
  "createdAt",
  "email",
  "firstName",
  "id",
  "isActive",
  "lastLogin",
  "lastName",
  "role",
  "username",
];

const alice = { username: "alice", email: "alice@example.com", password: "Silver meadow 58!" };

const register = (body) => request(app).post("/api/v1/auth/register").send(body);
const login = (emailOrUsername, password) =>
  request(app).post("/api/v1/auth/login").send({ emailOrUsername, password });
const as = (req, token) => req.set("Authorization", `Bearer ${token}`);
const me = (token) => as(request(app).get("/api/v1/auth/me"), token);
const changePassword = (token, body) => as(request(app).put("/api/v1/auth/password"), token).send(body);
const updateProfile = (token, body) => as(request(app).put("/api/v1/auth/profile"), token).send(body);

function expectUserView(user) {
  expect(Object.keys(user).sort()).toEqual(USER_KEYS);
  expect(user).not.toHaveProperty("password");
  expect(user).not.toHaveProperty("_id");
  expect(user).not.toHaveProperty("__v");
}

describe("POST /api/v1/auth/register", () => {
  it("registers by the contract: 201 { user, token }", async () => {
    const res = await register(alice);

    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
    expect(Object.keys(res.body.data).sort()).toEqual(["token", "user"]);
    expectUserView(res.body.data.user);
    expect(res.body.data.user).toMatchObject({
      username: "alice",
      email: "alice@example.com",
      role: "user",
      isActive: true,
      firstName: null,
      lastName: null,
      lastLogin: null,
    });
  });

  it.each([
    ["the repeated password", { ...alice, confirmPassword: "secret123" }, "confirmPassword"],
    ["an operator for the email", { ...alice, email: { $gt: "" } }, "email"],
    ["a username with a space", { ...alice, username: "a b" }, "username"],
    ["a password of five characters", { ...alice, password: "short" }, "password"],
  ])("refuses %s: 400 on the field", async (name, body, field) => {
    const res = await register(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(Object.keys(res.body.error.fields)).toContain(field);
  });
});

describe("POST /api/v1/auth/login and GET /api/v1/auth/me", () => {
  it("signs in by the contract", async () => {
    await register(alice);

    const res = await login(alice.email, alice.password);

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
    expectUserView(res.body.data.user);
    expect(res.body.data.user.lastLogin).not.toBeNull();

    const current = await me(res.body.data.token);
    expect(current.status).toBe(200);
    expectUserView(current.body.data);
  });

  it("refuses an object for the email or username: 400", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ emailOrUsername: {}, password: "x" });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("emailOrUsername");
  });

  it("signs in with a valid urlencoded body", async () => {
    expect((await register(alice)).status).toBe(201);
    const body = new URLSearchParams({
      emailOrUsername: alice.email,
      password: alice.password,
    }).toString();

    const res = await request(app).post("/api/v1/auth/login").type("form").send(body);

    expect(res.status).toBe(200);
    expectUserView(res.body.data.user);
    expect(res.body.data.token).toEqual(expect.any(String));
    const current = await me(res.body.data.token);
    expect(current.status).toBe(200);
    expectUserView(current.body.data);
    expect(current.body.data.id).toBe(res.body.data.user.id);
  });
});

describe("PUT /api/v1/auth/password", () => {
  it("changes the password: a new token for this device, every other token ends", async () => {
    const user = await createUser();
    const here = await loginAs(app, user);
    const elsewhere = await loginAs(app, user);

    const res = await changePassword(here, { currentPassword: "secret123", newPassword: "Velvet compass 92!" });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data).sort()).toEqual(["token", "user"]);
    expectUserView(res.body.data.user);
    expect((await me(here)).status).toBe(401);
    expect((await me(elsewhere)).status).toBe(401);
    expect((await me(res.body.data.token)).status).toBe(200);
    expect((await login(user.email, "Velvet compass 92!")).status).toBe(200);
  });

  it("answers a wrong current password with 400 on the field, never 401", async () => {
    const token = await loginAs(app, await createUser());

    const wrong = await changePassword(token, { currentPassword: "not-it", newPassword: "Velvet compass 92!" });
    const same = await changePassword(token, { currentPassword: "secret123", newPassword: "secret123" });

    expect(wrong.status).toBe(400);
    expect(wrong.body.error.fields).toEqual({ currentPassword: "incorrect" });
    expect(same.status).toBe(400);
    expect(same.body.error.fields).toEqual({ newPassword: "same_as_current" });
    expect((await me(token)).status).toBe(200);
  });
});

describe("PUT /api/v1/auth/profile", () => {
  it("updates the profile by the contract", async () => {
    const token = await loginAs(app, await createUser());

    const res = await updateProfile(token, { firstName: "Jana" });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
    expectUserView(res.body.data);
    expect(res.body.data.firstName).toBe("Jana");
  });

  it("answers a username someone else has with 409 on the field", async () => {
    const taken = await createUser();
    const token = await loginAs(app, await createUser());

    const res = await updateProfile(token, { username: taken.username });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: "CONFLICT", fields: { username: "duplicate" } });
  });

  it("refuses a role in the profile: 400, and the role stays", async () => {
    const user = await createUser();
    const token = await loginAs(app, user);

    const res = await updateProfile(token, { role: "admin" });

    expect(res.status).toBe(400);
    expect((await User.findById(user._id)).role).toBe("user");
  });
});

describe("a stored moderator", () => {
  it("reads a stored moderator as a user", async () => {
    const { insertedId } = await User.collection.insertOne({
      username: "old-moderator",
      email: "moderator@example.com",
      password: await bcrypt.hash("secret123", 10),
      role: "moderator",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await login("moderator@example.com", "secret123");

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("user");
    expect((await User.collection.findOne({ _id: insertedId })).lastLogin).toBeInstanceOf(Date);
    const token = res.body.data.token;
    expect((await as(request(app).get("/api/v1/users"), token)).status).toBe(403);

    const changed = await changePassword(token, { currentPassword: "secret123", newPassword: "Velvet compass 92!" });
    expect(changed.status).toBe(200);
  });
});
