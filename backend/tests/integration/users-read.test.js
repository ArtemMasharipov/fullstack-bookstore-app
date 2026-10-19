import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import User from "../../models/User.js";
import { getUserStats } from "../../services/userService.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();
const KEYS = ["id", "username", "email", "firstName", "lastName", "role", "isActive", "lastLogin", "createdAt"].sort();
let token, person;
beforeEach(async () => {
  token = await loginAs(app, await createUser({ role: "admin" }));
  person = await createUser({ firstName: "Jan", lastName: "Novák" });
});
const get = (path) => request(app).get(`/api/v1/users${path}`).set("Authorization", `Bearer ${token}`);

describe("admin user reads", () => {
  it("lists only public user fields with four pagination fields", async () => {
    const res = await get("");
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(["data", "pagination", "success"]);
    expect(res.body.pagination).toEqual({ page: 1, limit: 20, total: 2, pages: 1 });
    for (const item of res.body.data) expect(Object.keys(item).sort()).toEqual(KEYS);
    const detail = await get(`/${person._id}`);
    expect(Object.keys(detail.body).sort()).toEqual(["data", "success"]);
    expect(Object.keys(detail.body.data).sort()).toEqual(KEYS);
    expect(detail.body.data).toMatchObject({ id: String(person._id), firstName: "Jan", lastName: "Novák", lastLogin: null });
  });

  it("treats regex punctuation as literal text and keeps role/status filters", async () => {
    await User.updateOne({ _id: person._id }, { $set: { firstName: "Literal (.*)", isActive: false } });
    for (const search of ["(", ".*"]) {
      const res = await get(`?search=${encodeURIComponent(search)}&role=user&isActive=false`);
      expect(res.status).toBe(200);
      expect(res.body.data.map((row) => row.id)).toEqual([String(person._id)]);
      expect((await get(`?search=${encodeURIComponent(search)}&isActive=true`)).body.data).toEqual([]);
    }
  });

  it("reads an old moderator as user in lists, filters, auth and statistics", async () => {
    await User.collection.updateOne({ _id: person._id }, { $set: { role: "moderator" } });
    const res = await get("?role=user");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ id: String(person._id), role: "user" });
    expect((await get(`/${person._id}`)).body.data.role).toBe("user");
    expect((await get("/stats")).body.data).toEqual({ total: 2, active: 2, inactive: 0, byRole: { user: 1, admin: 1 } });
    const userToken = await loginAs(app, person);
    expect((await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${userToken}`)).body.data.role).toBe("user");
  });

  it.each(["createdAt", "-createdAt", "lastLogin", "-lastLogin"])("breaks %s ties by id across pages", async (sortBy) => {
    const date = new Date("2026-10-01T00:00:00Z");
    const ids = Array.from({ length: 21 }, () => new mongoose.Types.ObjectId());
    await User.collection.insertMany(ids.map((_id, index) => ({ _id, username: `page_${index}`, email: `page_${index}@example.com`,
      role: "user", isActive: true, createdAt: date, lastLogin: date })));
    const read = async (page) => (await get(`?search=page_&limit=10&page=${page}&sortBy=${sortBy}`)).body;
    const pages = await Promise.all([read(1), read(2), read(3)]);
    const expected = ids.map(String).sort();
    if (sortBy.startsWith("-")) expected.reverse();
    expect(pages.flatMap((res) => res.data.map((row) => row.id))).toEqual(expected);
    expect(pages[1].pagination).toEqual({ page: 2, limit: 10, total: 21, pages: 3 });
  });

  it.each(["username", "-username", "email", "-email"])("sorts user identities by %s", async (sortBy) => {
    await createUser({ username: "aaa", email: "aaa@example.com" });
    await createUser({ username: "zzz", email: "zzz@example.com" });
    const res = await get(`?sortBy=${sortBy}`);
    expect(res.status).toBe(200);
    const key = sortBy.replace(/^-/, "");
    const values = res.body.data.map((row) => row[key]);
    const expected = [...values].sort();
    if (sortBy.startsWith("-")) expected.reverse();
    expect(values).toEqual(expected);
  });

  it.each(["page=0", "page=0x10", "page=1e1", "page[]=2", "page=1&page=2", "limit=101", "role=moderator", "isActive=0", "search=", "search[]=x", "sortBy=password", "extra=1"])("rejects an invalid list query %s", async (query) => {
    const res = await get(`?${query}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(Object.keys(res.body.error.fields).length).toBeGreaterThan(0);
  });

  it("validates detail and stats query and ids before reaching storage", async () => {
    for (const path of [`/${person._id}?extra=1`, "/stats?extra=1", "/bad"]) {
      expect((await get(path)).status).toBe(400);
    }
    expect((await get("/64b7f0c2a1b2c3d4e5f60718")).status).toBe(404);
  });

  it("returns explicit zero roles for a database without users", async () => {
    // An HTTP admin route cannot be called without any users; exercise the
    // aggregate directly against the same real test database for this case.
    await User.deleteMany({});
    expect(await getUserStats()).toEqual({ total: 0, active: 0, inactive: 0, byRole: { user: 0, admin: 0 } });
  });
});
