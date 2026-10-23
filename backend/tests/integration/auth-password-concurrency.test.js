import request from "supertest";
import { afterEach, expect, it, vi } from "vitest";
import app from "../../app.js";
import User from "../../models/User.js";
import Session from "../../models/Session.js";
import { issueToken } from "../../services/sessions.js";
import { createUser } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();
afterEach(() => vi.restoreAllMocks());
const GOOD = "Cedar lantern 47!";
const NEXT = "Velvet compass 92!";
const OTHER = "Silver meadow 58!";
const LEGACY = "$2b$10$MPbgVxQ8zfl/WU2Q6GCTJOaN7G3JmLurBXQ9jN08fiqIpmpHXTnyy";
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const login = (user, password = GOOD) => request(app).post("/api/v1/auth/login").send({ emailOrUsername: user.email, password }).then(res => res);
const change = (token, newPassword = NEXT, currentPassword = GOOD) => request(app).put("/api/v1/auth/password").set("Authorization", "Bearer " + token).send({ currentPassword, newPassword }).then(res => res);
const me = token => request(app).get("/api/v1/auth/me").set("Authorization", "Bearer " + token);
const stored = id => User.findById(id).select("+password").lean();

it.each(["password", "logout-all", "deactivate", "demote"])("a late session insertion cannot survive %s", async kind => {
  const user = await createUser({ password: GOOD, role: "admin" });
  const actor = await createUser({ role: "admin" });
  const original = await issueToken(user._id), actorToken = await issueToken(actor._id);
  const entered = deferred(), release = deferred();
  const create = Session.create.bind(Session);
  let paused = false;
  vi.spyOn(Session, "create").mockImplementation(async (...args) => {
    if (!paused && String(args[0].user) === String(user._id)) {
      paused = true;
      entered.resolve();
      await release.promise;
    }
    return create(...args);
  });
  const pending = login(user);
  let operation;
  try {
    await entered.promise;
    if (kind === "password") operation = await change(original);
    if (kind === "logout-all") operation = await request(app).delete("/api/v1/auth/sessions").set("Authorization", "Bearer " + original);
    if (kind === "deactivate") operation = await request(app).patch("/api/v1/users/" + user.id + "/status").set("Authorization", "Bearer " + actorToken).send({ isActive: false });
    if (kind === "demote") operation = await request(app).put("/api/v1/users/" + user.id).set("Authorization", "Bearer " + actorToken).send({ role: "user" });
    expect(operation.status).toBe(kind === "logout-all" ? 204 : 200);
  } finally {
    release.resolve();
    await pending;
  }
  expect((await pending).status).toBe(401);
  expect(await Session.countDocuments({ user: user._id })).toBe(kind === "password" ? 1 : 0);
  expect((await me(original)).status).toBe(401);
  expect((await me(actorToken)).status).toBe(200);
  if (kind === "password") expect((await me(operation.body.data.token)).status).toBe(200);
  expect((await stored(user._id)).__v).toBeGreaterThanOrEqual(1);
});

it("a delayed legacy rehash cannot restore a password changed meanwhile", async () => {
  const user = await createUser();
  await User.updateOne({ _id: user._id }, { $set: { password: LEGACY } });
  const token = await issueToken(user._id);
  const entered = deferred(), release = deferred();
  const update = User.updateOne.bind(User);
  vi.spyOn(User, "updateOne").mockImplementation((filter, changes, ...args) => {
    const query = update(filter, changes, ...args);
    if (String(filter._id) === String(user._id) && changes.$set?.password?.startsWith("$argon2id$")) {
      const exec = query.exec.bind(query);
      query.exec = async (...execArgs) => { entered.resolve(); await release.promise; return exec(...execArgs); };
    }
    return query;
  });
  const pending = login(user, "secret123");
  let changed;
  try {
    expect(await Promise.race([entered.promise.then(() => true), pending.then(() => false)])).toBe(true);
    changed = await change(token, NEXT, "secret123");
    expect(changed.status).toBe(200);
  } finally { release.resolve(); await pending; }
  expect((await pending).status).toBe(401);
  expect((await login(user, NEXT)).status).toBe(200);
  expect((await login(user, "secret123")).status).toBe(401);
  expect((await me(changed.body.data.token)).status).toBe(200);
});

it("two password changes from the same snapshot commit exactly one credential", async () => {
  const user = await createUser({ password: GOOD });
  const token = await issueToken(user._id);
  const ready = deferred(), release = deferred();
  const find = User.findById.bind(User);
  let reads = 0;
  vi.spyOn(User, "findById").mockImplementation((id, ...args) => {
    const query = find(id, ...args), exec = query.exec.bind(query);
    if (String(id) === String(user._id)) query.exec = async (...execArgs) => {
      const result = await exec(...execArgs);
      if (++reads <= 2) { if (reads === 2) ready.resolve(); await release.promise; }
      return result;
    };
    return query;
  });
  const requests = [change(token, NEXT), change(token, OTHER)];
  try { await ready.promise; } finally { release.resolve(); await Promise.all(requests); }
  const responses = await Promise.all(requests);
  expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
  const winner = responses.findIndex(response => response.status === 200);
  expect((await login(user, [NEXT, OTHER][winner])).status).toBe(200);
  expect((await login(user, [OTHER, NEXT][winner])).status).toBe(401);
  expect((await me(token)).status).toBe(401);
  expect((await me(responses[winner].body.data.token)).status).toBe(200);
  expect((await stored(user._id)).__v).toBe(1);
});

it.each(["firstName", "username"])("a concurrent profile %s write is preserved during password work", async field => {
  const user = await createUser({ password: GOOD });
  const token = await issueToken(user._id);
  const entered = deferred(), release = deferred();
  const find = User.findById.bind(User);
  let paused = false;
  vi.spyOn(User, "findById").mockImplementation((id, ...args) => {
    const query = find(id, ...args), exec = query.exec.bind(query);
    if (!paused && String(id) === String(user._id)) {
      paused = true;
      query.exec = async (...execArgs) => { const result = await exec(...execArgs); entered.resolve(); await release.promise; return result; };
    }
    return query;
  });
  const pending = change(token);
  const value = field === "username" ? "Velvet" : "Newer profile";
  try {
    await entered.promise;
    expect((await request(app).put("/api/v1/auth/profile").set("Authorization", "Bearer " + token).send({ [field]: value })).status).toBe(200);
  } finally { release.resolve(); await pending; }
  expect((await pending).status).toBe(field === "username" ? 409 : 200);
  expect((await stored(user._id))[field]).toBe(value);
  if (field === "firstName") expect((await pending).body.data.user.firstName).toBe(value);
  else expect((await me(token)).status).toBe(200);
});

it.each([undefined, 0, 7])("password rotation advances committed version %s without resetting access", async version => {
  const user = await createUser({ password: GOOD });
  await User.collection.updateOne({ _id: user._id }, version === undefined ? { $unset: { __v: "" } } : { $set: { __v: version } });
  const token = await issueToken(user._id);
  const response = await change(token);
  expect(response.status).toBe(200);
  expect((await stored(user._id)).__v).toBe((version ?? 0) + 1);
  expect((await stored(user._id)).role).toBe("user");
  expect((await me(token)).status).toBe(401);
  expect((await me(response.body.data.token)).status).toBe(200);
});

it("concurrent legacy logins keep one PHC upgrade at the existing version", async () => {
  const user = await createUser();
  await User.updateOne({ _id: user._id }, { $set: { password: LEGACY, __v: 7 } });
  const responses = await Promise.all([login(user, "secret123"), login(user, "secret123")]);
  expect(responses.map(response => response.status)).toEqual([200, 200]);
  const final = await stored(user._id);
  expect(final.password).toMatch(/^\$argon2id\$/);
  expect(final.__v).toBe(7);
  expect(await Session.countDocuments({ user: user._id })).toBe(2);
});

it("pending access cannot authorize password work or be reset by legacy login", async () => {
  const user = await createUser();
  await User.updateOne({ _id: user._id }, { $set: { password: LEGACY, __v: -3, isActive: false } });
  const token = await issueToken(user._id);
  expect((await change(token, NEXT, "secret123")).status).toBe(409);
  expect((await login(user, "secret123")).status).toBe(401);
  const final = await stored(user._id);
  expect(final).toMatchObject({ password: LEGACY, __v: -3, isActive: false });
});

it("a real pending same-value access write rejects login and password rotation", async () => {
  const user = await createUser({ password: GOOD });
  const actor = await createUser({ role: "admin" });
  const token = await issueToken(user._id), actorToken = await issueToken(actor._id);
  const entered = deferred(), release = deferred();
  const write = User.findOneAndUpdate.bind(User);
  vi.spyOn(User, "findOneAndUpdate").mockImplementation((filter, updates, ...args) => {
    const query = write(filter, updates, ...args), exec = query.exec.bind(query);
    if (String(filter._id) === String(user._id) && updates.$set?.__v < 0 && updates.$set?.role === "user") {
      query.exec = async (...execArgs) => { const result = await exec(...execArgs); entered.resolve(); await release.promise; return result; };
    }
    return query;
  });
  const access = request(app).put("/api/v1/users/" + user.id).set("Authorization", "Bearer " + actorToken).send({ role: "user" }).then(res => res);
  try {
    await entered.promise;
    expect((await change(token)).status).toBe(409);
    expect((await login(user)).status).toBe(401);
  } finally { release.resolve(); await access; }
  expect((await access).status).toBe(200);
  expect((await stored(user._id)).__v).toBe(1);
  expect(await Session.countDocuments({ user: user._id })).toBe(1);
  expect((await me(token)).status).toBe(200);
});

it.each(["status", "role"])("a late registration session cannot bypass an admin %s write", async kind => {
  const actor = await createUser({ role: "admin" }), actorToken = await issueToken(actor._id);
  const entered = deferred(), release = deferred();
  const create = Session.create.bind(Session);
  let target;
  vi.spyOn(Session, "create").mockImplementation(async (...args) => {
    if (!target && String(args[0].user) !== String(actor._id)) {
      target = args[0].user;
      entered.resolve();
      await release.promise;
    }
    return create(...args);
  });
  const registration = request(app).post("/api/v1/auth/register").send({ username: "joining_member", email: "joining@example.com", password: GOOD }).then(res => res);
  try {
    await entered.promise;
    const response = kind === "status"
      ? await request(app).patch("/api/v1/users/" + target + "/status").set("Authorization", "Bearer " + actorToken).send({ isActive: false })
      : await request(app).put("/api/v1/users/" + target).set("Authorization", "Bearer " + actorToken).send({ role: "admin" });
    expect(response.status).toBe(200);
  } finally { release.resolve(); await registration; }
  expect((await registration).status).toBe(401);
  expect(await Session.countDocuments({ user: target })).toBe(0);
  const final = await stored(target);
  expect(final.__v).toBe(1);
  if (kind === "role") expect(final.role).toBe("admin");
  else expect(final.isActive).toBe(false);
});
