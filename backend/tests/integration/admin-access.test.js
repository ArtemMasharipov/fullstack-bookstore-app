import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

// Every endpoint that only an admin may use: a guest gets 401, a user 403, and
// an admin gets past the access check (any answer but 401 and 403). A change
// that adds an admin endpoint adds it to this list.
useTestDatabase();

// A well-formed id that no document has
const ID = "5f0c9a1b2c3d4e5f6a7b8c9d";

const ADMIN_ENDPOINTS = [
  ["post", "/api/v1/books"],
  ["put", `/api/v1/books/${ID}`],
  ["patch", `/api/v1/books/${ID}/stock`],
  ["delete", `/api/v1/books/${ID}`],
  ["post", "/api/v1/authors"],
  ["put", `/api/v1/authors/${ID}`],
  ["delete", `/api/v1/authors/${ID}`],
  ["get", "/api/v1/users"],
  ["get", "/api/v1/users/stats"],
  ["get", "/api/v1/users/role/user"],
  ["get", `/api/v1/users/${ID}`],
  ["post", "/api/v1/users"],
  ["put", `/api/v1/users/${ID}`],
  ["patch", `/api/v1/users/${ID}/status`],
  ["delete", `/api/v1/users/${ID}`],
  ["delete", `/api/v1/users/${ID}/permanent`],
  ["get", "/api/v1/orders/admin/all"],
  ["get", "/api/v1/orders/admin/stats"],
  ["patch", `/api/v1/orders/${ID}/status`],
  ["patch", `/api/v1/orders/${ID}/pay`],
];

const send = (method, path, token) => {
  const req = request(app)[method](path);
  if (token) req.set("Authorization", `Bearer ${token}`);
  return method === "get" || method === "delete" ? req : req.send({});
};

describe("admin endpoints", () => {
  let userToken;
  let adminToken;

  beforeEach(async () => {
    userToken = await loginAs(app, await createUser());
    adminToken = await loginAs(app, await createUser({ role: "admin" }));
  });

  it.each(ADMIN_ENDPOINTS)("guest gets 401 from %s %s", async (method, path) => {
    const res = await send(method, path);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it.each(ADMIN_ENDPOINTS)("a user gets 403 from %s %s", async (method, path) => {
    const res = await send(method, path, userToken);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it.each(ADMIN_ENDPOINTS)("an admin passes the access check of %s %s", async (method, path) => {
    const res = await send(method, path, adminToken);

    expect([401, 403]).not.toContain(res.status);
  });
});
