import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAuthor } from "../helpers/factories.js";

useTestDatabase();

beforeEach(async () => {
  await createAuthor({ firstName: "Karel", lastName: "Čapek", country: "Czech Republic" });
  await createAuthor({ firstName: "Charles", lastName: "Darwin", country: "United Kingdom" });
});

const get = (path) => request(app).get(`/api/v1/authors${path}`);
const lastNames = (res) => res.body.data.map((author) => author.lastName);

describe("author country filters", () => {
  it("GET /api/v1/authors/country/( answers 200 with no authors", async () => {
    const res = await get("/country/(");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("GET /api/v1/authors?country=( answers 200 with no authors", async () => {
    const res = await get("?country=(");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("matches the country exactly", async () => {
    expect(lastNames(await get("/country/Czech%20Republic"))).toEqual(["Čapek"]);
    expect(lastNames(await get("/country/czech"))).toEqual([]);
    expect(lastNames(await get("?country=Czech%20Republic"))).toEqual(["Čapek"]);
  });

  it.each([
    ["?country[$ne]=x", "country"],
    ["?sortBy=__v", "sortBy"],
    ["?limit=0", "limit"],
    ["?foo=1", "foo"],
    ["/country/x?sortBy=password", "sortBy"],
  ])("refuses %s with 400 VALIDATION_FAILED", async (path, field) => {
    const res = await get(path);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(Object.keys(res.body.error.fields)).toContain(field);
  });

  it("GET /api/v1/authors without parameters answers as before", async () => {
    const res = await get("");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toEqual(
      expect.objectContaining({ page: 1, limit: 20, total: 2, pages: 1 })
    );
  });
});
