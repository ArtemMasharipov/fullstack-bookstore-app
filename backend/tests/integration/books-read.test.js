import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import Book from "../../models/Book.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAuthor, createBook } from "../helpers/factories.js";

useTestDatabase();

const BOOK_KEYS = [
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
];

let author;

beforeEach(async () => {
  author = await createAuthor({ firstName: "Božena", lastName: "Němcová", bio: "Czech writer." });
});

const get = (path) => request(app).get(`/api/v1/books${path}`);

// Stored directly, so several books can share one createdAt
async function insertBooks(count, overrides = {}) {
  const at = new Date("2026-10-01T10:00:00Z");
  const docs = Array.from({ length: count }, (_, i) => ({
    title: `Book ${i + 1}`,
    author: author._id,
    publicationYear: 1900,
    price: 199,
    inStock: true,
    createdAt: at,
    updatedAt: at,
    ...overrides,
  }));
  const { insertedIds } = await Book.collection.insertMany(docs);
  return Object.values(insertedIds).map(String);
}

describe("GET /api/v1/books", () => {
  it("pages 25 books by 12: three pages that never overlap and together hold every book", async () => {
    const ids = [];
    for (let i = 1; i <= 25; i += 1) {
      ids.push(String((await createBook({ author: author._id, title: `Book ${i}` }))._id));
    }

    const seen = [];
    for (const [page, size] of [
      [1, 12],
      [2, 12],
      [3, 1],
    ]) {
      const res = await get(`?page=${page}&limit=12`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(size);
      expect(res.body.pagination).toEqual({ page, limit: 12, total: 25, pages: 3 });
      seen.push(...res.body.data.map((book) => book.id));
    }

    expect(new Set(seen).size).toBe(25);
    expect([...seen].sort()).toEqual([...ids].sort());
  });

  it("orders books created at the same moment newest id first", async () => {
    const ids = await insertBooks(3);

    const res = await get("");

    expect(res.body.data.map((book) => book.id)).toEqual([...ids].reverse());
  });

  it("answers every book in the contract shape", async () => {
    await createBook({
      author: author._id,
      title: "Babička",
      category: "Fiction",
      description: "A novel.",
      image: "data:image/svg+xml,",
    });

    const res = await get("");
    const [book] = res.body.data;

    expect(Object.keys(book).sort()).toEqual(BOOK_KEYS);
    expect(book.author).toEqual({ id: String(author._id), firstName: "Božena", lastName: "Němcová" });
    expect(typeof book.id).toBe("string");
  });

  it("answers a book whose author no longer exists with author null", async () => {
    await insertBooks(1, { author: new mongoose.Types.ObjectId() });

    const res = await get("");

    expect(res.body.data[0].author).toBeNull();
  });

  it("matches a category exactly", async () => {
    for (const category of ["Fiction", "Science Fiction", "Non-Fiction"]) {
      await createBook({ author: author._id, title: category, category });
    }

    const exact = await get("?category=Fiction");
    const lower = await get("?category=fiction");

    expect(exact.body.data.map((book) => book.title)).toEqual(["Fiction"]);
    expect(lower.body.data).toEqual([]);
  });

  it("answers an empty page for a category with regex characters", async () => {
    await createBook({ author: author._id, category: "Fiction" });

    const res = await get("?category=(");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it.each([
    ["category[$ne]=x", "category"],
    ["category=a&category=b", "category"],
    ["sortBy=__v", "sortBy"],
    ["page=0", "page"],
    ["limit=101", "limit"],
    ["foo=1", "foo"],
    ["authorId=abc", "authorId"],
    ["inStock=yes", "inStock"],
  ])("refuses ?%s with 400 VALIDATION_FAILED", async (query, field) => {
    const res = await get(`?${query}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(Object.keys(res.body.error.fields)).toContain(field);
  });

  it("accepts the parameters the admin and the dashboard send", async () => {
    expect((await get("?page=1&limit=10")).status).toBe(200);
    expect((await get("?page=1&limit=12")).status).toBe(200);
  });
});

describe("GET /api/v1/books/:id", () => {
  it("answers the book with the author's bio", async () => {
    const book = await createBook({ author: author._id });

    const res = await get(`/${book._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(String(book._id));
    expect(res.body.data).not.toHaveProperty("_id");
    expect(res.body.data.author).toEqual({
      id: String(author._id),
      firstName: "Božena",
      lastName: "Němcová",
      bio: "Czech writer.",
    });
  });

  it("refuses a malformed id with 400 naming the id", async () => {
    const res = await get("/not-an-id");

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ id: "invalid_format" });
  });
});

describe("GET /api/v1/books/category/:category", () => {
  it("answers 200 with no books for regex characters", async () => {
    await createBook({ author: author._id, category: "Fiction" });

    const res = await get("/category/(");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [] });
  });

  it("lists only books in stock of exactly that category", async () => {
    await createBook({ author: author._id, title: "In", category: "Fiction" });
    await createBook({ author: author._id, title: "Out", category: "Fiction", inStock: false });
    await createBook({ author: author._id, title: "Other", category: "Science Fiction" });

    const res = await get("/category/Fiction");

    expect(res.body).not.toHaveProperty("count");
    expect(res.body.data.map((book) => book.title)).toEqual(["In"]);
    expect(res.body.data[0]).not.toHaveProperty("_id");
  });

  it("refuses a sort outside the list", async () => {
    const res = await get("/category/Fiction?sortBy=password");

    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/books/author/:authorId", () => {
  it("lists the author's books without count", async () => {
    const book = await createBook({ author: author._id });

    const res = await get(`/author/${author._id}`);

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("count");
    expect(res.body.data.map((b) => b.id)).toEqual([String(book._id)]);
  });

  it("refuses a malformed author id with 400", async () => {
    const res = await get("/author/abc");

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ authorId: "invalid_format" });
  });
});
