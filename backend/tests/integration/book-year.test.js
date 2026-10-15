import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../app.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAuthor } from "../helpers/factories.js";

// A book's publication year is valid from 1450 up to
// and including the current year. Admin creates and updates books through the API.
useTestDatabase();

const currentYear = new Date().getFullYear();

let admin;
let author;

beforeEach(async () => {
  admin = await createUser({ role: "admin" });
  author = await createAuthor();
});

afterEach(() => {
  vi.useRealTimers();
});

const bookWithYear = (publicationYear) => ({
  title: `Book of ${publicationYear}`,
  authorId: author.id,
  publicationYear,
  price: 10,
});

const postBook = (token, body) =>
  request(app)
    .post("/api/v1/books")
    .set("Authorization", `Bearer ${token}`)
    .send(body);

describe("POST /api/v1/books: publication year", () => {
  it.each([1450, 1999, currentYear])(
    "accepts %i: 201 and the year is stored",
    async (year) => {
      const token = await loginAs(app, admin);

      const res = await postBook(token, bookWithYear(year));

      expect(res.status).toBe(201);
      expect(res.body.data.publicationYear).toBe(year);
    }
  );

  it("rejects next year: 400 VALIDATION_FAILED on publicationYear", async () => {
    const token = await loginAs(app, admin);

    const res = await postBook(token, bookWithYear(currentYear + 1));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(Object.keys(res.body.error.fields)).toEqual(["publicationYear"]);
  });

  it("accepts 2031 once the clock reads 1 January 2031: the bound is read at validation time", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // Local midnight: the first instant of 2031 in the process time zone, which
    // is the time zone getFullYear() reads
    vi.setSystemTime(new Date(2031, 0, 1));
    // Log in under the fake clock: a token issued at the real time would be
    // long expired in 2031
    const token = await loginAs(app, admin);

    const res = await postBook(token, bookWithYear(2031));

    expect(res.status).toBe(201);
    expect(res.body.data.publicationYear).toBe(2031);
  });
});

describe("PUT /api/v1/books/:id: publication year", () => {
  it("accepts a new year: 200 and the year is stored", async () => {
    const token = await loginAs(app, admin);
    const created = await postBook(token, bookWithYear(1999));
    expect(created.status).toBe(201);

    const res = await request(app)
      .put(`/api/v1/books/${created.body.data._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ publicationYear: 2000 });

    expect(res.status).toBe(200);
    expect(res.body.data.publicationYear).toBe(2000);
  });
});
