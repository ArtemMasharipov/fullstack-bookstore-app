import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

// page and limit of every list are whole numbers written in digits: a hex or
// exponent form, spaces, a repeated parameter or a fraction answers 400
useTestDatabase();

const LISTS = [
  ["/api/v1/books", null],
  ["/api/v1/authors", null],
  ["/api/v1/orders", "user"],
  ["/api/v1/orders/admin/all", "admin"],
];

const BAD_VALUES = [
  ["page=0x10", "page"],
  ["page=1e1", "page"],
  ["page=%202%20", "page"],
  ["page[]=2", "page"],
  ["page=-1", "page"],
  ["page=1.5", "page"],
  ["limit=0x10", "limit"],
  ["limit=1e1", "limit"],
];

const CASES = LISTS.flatMap(([path, role]) =>
  BAD_VALUES.map(([query, field]) => [query, path, role, field])
);

let tokens;

beforeEach(async () => {
  tokens = {
    user: await loginAs(app, await createUser()),
    admin: await loginAs(app, await createUser({ role: "admin" })),
  };
});

const get = (path, role) => {
  const req = request(app).get(path);
  return role ? req.set("Authorization", `Bearer ${tokens[role]}`) : req;
};

describe("page and limit of the lists", () => {
  it.each(CASES)("refuses ?%s on %s with 400 VALIDATION_FAILED", async (query, path, role, field) => {
    const res = await get(`${path}?${query}`, role);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(Object.keys(res.body.error.fields)).toContain(field);
  });

  it.each(LISTS)("reads ?page=2&limit=5 as numbers on %s", async (path, role) => {
    const res = await get(`${path}?page=2&limit=5`, role);

    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual(expect.objectContaining({ page: 2, limit: 5 }));
  });
});
