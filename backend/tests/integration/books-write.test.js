import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import Book from "../../models/Book.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAuthor, createBook } from "../helpers/factories.js";

// The admin's book writes: strict bodies, the book view in the answer, 204 on
// delete, 400 on the author field for an unknown author and 409 for the same
// title, author and year
useTestDatabase();

const currentYear = new Date().getFullYear();
// A well-formed id that no document has
const MISSING = "5f0c9a1b2c3d4e5f6a7b8c9d";
const SEED_COVER =
  "data:image/svg+xml," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"/>');

let token;
let author;

beforeEach(async () => {
  token = await loginAs(app, await createUser({ role: "admin" }));
  author = await createAuthor();
});

const valid = (overrides = {}) => ({
  title: "Krakatit",
  authorId: author.id,
  publicationYear: 1924,
  category: "Fiction",
  description: "Román",
  price: 249.9,
  image: "https://example.com/krakatit.jpg",
  inStock: true,
  ...overrides,
});

const send = (method, path, body) =>
  request(app)[method](`/api/v1/books${path}`).set("Authorization", `Bearer ${token}`).send(body);
const post = (body) => send("post", "", body);
const put = (id, body) => send("put", `/${id}`, body);

describe("POST /api/v1/books", () => {
  it("creates a book by the contract: 201 and the book view", async () => {
    const res = await post(valid());

    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
    expect(Object.keys(res.body.data).sort()).toEqual([
      "author",
      "category",
      "createdAt",
      "description",
      "id",
      "image",
      "inStock",
      "price",
      "publicationYear",
      "title",
      "updatedAt",
    ]);
    expect(res.body.data.author).toEqual({ id: author.id, firstName: "Karel", lastName: "Čapek" });
    expect(res.body.data).toMatchObject({ title: "Krakatit", price: 249.9, inStock: true });
  });

  it.each([
    ["an unknown field", { isbn: "x" }, "isbn", "unrecognized_keys"],
    ["a one-letter title", { title: "K" }, "title", "too_small"],
    ["a malformed author id", { authorId: "nope" }, "authorId", "invalid_format"],
    ["a year before 1450", { publicationYear: 1449 }, "publicationYear", "too_small"],
    ["next year", { publicationYear: currentYear + 1 }, "publicationYear", "too_big"],
    ["a year as a string", { publicationYear: "1924" }, "publicationYear", "invalid_type"],
    ["a negative price", { price: -1 }, "price", "too_small"],
    ["a price with three decimals", { price: 10.005 }, "price", undefined],
    ["a price of a million", { price: 1000000 }, "price", "too_big"],
    ["an empty category", { category: "" }, "category", "too_small"],
    ["a description of 1001 characters", { description: "x".repeat(1001) }, "description", "too_big"],
    ["a stock flag as a string", { inStock: "yes" }, "inStock", "invalid_type"],
    ["an http cover", { image: "http://example.com/a.jpg" }, "image", "invalid_format"],
    ["a javascript: cover", { image: "javascript:alert(1)" }, "image", "invalid_format"],
    ["an html data cover", { image: "data:text/html,<p>" }, "image", "invalid_format"],
    ["an https cover over 2048 characters", { image: `https://e.com/${"a".repeat(2048)}` }, "image", undefined],
  ])("refuses %s with 400 on that field", async (_, change, field, code) => {
    const res = await post(valid(change));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(Object.keys(res.body.error.fields)).toEqual([field]);
    if (code) expect(res.body.error.fields[field]).toBe(code);
    expect(await Book.countDocuments()).toBe(0);
  });

  it("accepts the seed's data:image/svg+xml cover and a book without a cover", async () => {
    const withSeedCover = await post(valid({ image: SEED_COVER }));
    const { image: _, ...withoutImage } = valid({ title: "Válka s mloky" });
    const withoutCover = await post(withoutImage);

    expect(withSeedCover.status).toBe(201);
    expect(withSeedCover.body.data.image).toBe(SEED_COVER);
    expect(withoutCover.status).toBe(201);
    expect(withoutCover.body.data.image).toBeUndefined();
  });

  it.each([19.99, 0, 999999.99])("accepts %d as a price", async (price) => {
    const res = await post(valid({ title: `Price ${price}`, price }));

    expect(res.status).toBe(201);
    expect(res.body.data.price).toBe(price);
  });

  it("takes the stock flag as true when the body leaves it out", async () => {
    const { inStock: _, ...body } = valid();

    const res = await post(body);

    expect(res.status).toBe(201);
    expect(res.body.data.inStock).toBe(true);
  });

  it("answers an unknown author with 400 on authorId", async () => {
    const res = await post(valid({ authorId: MISSING }));

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(
      expect.objectContaining({ code: "VALIDATION_FAILED", fields: { authorId: "not_found" } })
    );
  });

  it("answers the same title, author and year with 409 CONFLICT on title", async () => {
    expect((await post(valid())).status).toBe(201);

    const res = await post(valid({ price: 99 }));

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual(
      expect.objectContaining({ code: "CONFLICT", fields: { title: "duplicate" } })
    );
    expect(await Book.countDocuments()).toBe(1);
  });
});

describe("PUT /api/v1/books/:id", () => {
  it("replaces a book: optional fields the body leaves out are removed", async () => {
    const created = (await post(valid())).body.data;
    const { description: _d, image: _i, inStock: _s, ...body } = valid({ price: 199.9 });

    const res = await put(created.id, body);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: created.id, price: 199.9, inStock: true });
    const stored = await Book.findById(created.id).lean();
    expect(stored).not.toHaveProperty("description");
    expect(stored).not.toHaveProperty("image");
    expect(stored.price).toBe(199.9);
  });

  it("keeps the book's own title without a conflict with itself", async () => {
    const created = (await post(valid())).body.data;

    const res = await put(created.id, valid({ price: 300 }));

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(300);
  });

  it("answers 409 when the change copies another book's title, author and year", async () => {
    await post(valid());
    const other = (await post(valid({ title: "Továrna na absolutno" }))).body.data;

    const res = await put(other.id, valid());

    expect(res.status).toBe(409);
    expect(res.body.error.fields).toEqual({ title: "duplicate" });
    expect((await Book.findById(other.id).lean()).title).toBe("Továrna na absolutno");
  });

  it("answers an unknown author with 400 on authorId", async () => {
    const created = (await post(valid())).body.data;

    const res = await put(created.id, valid({ authorId: MISSING }));

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ authorId: "not_found" });
  });

  it.each([
    ["_id", { _id: MISSING }],
    ["author", { author: MISSING }],
    ["createdAt", { createdAt: "2020-01-01T00:00:00.000Z" }],
    ["$set", { $set: { title: "Changed" } }],
  ])("refuses a body with %s and leaves the book as it was", async (key, change) => {
    const book = await createBook({ title: "R.U.R." });

    const res = await put(book.id, valid(change));

    expect(res.status).toBe(400);
    expect(res.body.error.fields[key]).toBe("unrecognized_keys");
    expect((await Book.findById(book.id).lean()).title).toBe("R.U.R.");
  });
});

describe("unknown and malformed book ids", () => {
  it.each([
    ["put", (id) => put(id, valid())],
    ["patch", (id) => send("patch", `/${id}/stock`, { inStock: false })],
    ["delete", (id) => send("delete", `/${id}`)],
  ])("%s answers 404 for an id no book has and 400 for a malformed one", async (_, call) => {
    const missing = await call(MISSING);
    const malformed = await call("not-an-id");

    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe("NOT_FOUND");
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.fields).toEqual({ id: "invalid_format" });
  });
});

describe("PATCH /api/v1/books/:id/stock", () => {
  it("changes only the stock and answers with the book view", async () => {
    const created = (await post(valid())).body.data;

    const res = await send("patch", `/${created.id}/stock`, { inStock: false });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
    expect(res.body.data).toEqual({ ...created, inStock: false, updatedAt: res.body.data.updatedAt });
  });

  it("refuses any other field", async () => {
    const created = (await post(valid())).body.data;

    const res = await send("patch", `/${created.id}/stock`, { inStock: false, price: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ price: "unrecognized_keys" });
  });
});

describe("DELETE /api/v1/books/:id", () => {
  it("deletes a book: 204 without a body, then 404", async () => {
    const created = (await post(valid())).body.data;

    const res = await send("delete", `/${created.id}`);

    expect(res.status).toBe(204);
    expect(res.text).toBe("");
    expect((await request(app).get(`/api/v1/books/${created.id}`)).status).toBe(404);
    expect((await send("delete", `/${created.id}`)).status).toBe(404);
  });
});
