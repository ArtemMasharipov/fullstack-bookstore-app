import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";
import Author from "../../models/Author.js";
import Book from "../../models/Book.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAuthor, createBook } from "../helpers/factories.js";

useTestDatabase();
const MISSING = "5f0c9a1b2c3d4e5f6a7b8c9d";
const get = (path = "") => request(app).get(`/api/v1/authors${path}`);
const ids = (res) => res.body.data.map((author) => author.id);
function expectView(author) {
  expect(author.id).toMatch(/^[a-f0-9]{24}$/);
  expect(author.firstName).toEqual(expect.any(String));
  expect(author.lastName).toEqual(expect.any(String));
  expect(author.bio).toEqual(expect.any(String));
  expect(author.createdAt).toEqual(expect.any(String));
  expect(author.updatedAt).toEqual(expect.any(String));
  for (const field of Object.keys(author)) {
    expect(["id", "firstName", "lastName", "bio", "birthYear", "country", "website", "booksCount", "createdAt", "updatedAt"]).toContain(field);
  }
}

describe("author read contracts", () => {
  it("lists only author view fields and four pagination fields", async () => {
    const author = await createAuthor({ country: "CZ", birthYear: 1890, website: "https://example.com" });
    await createBook({ author: author._id });
    await Author.collection.updateOne({ _id: author._id }, { $set: { books: [new mongoose.Types.ObjectId()], privateNote: "hidden" } });
    const stored = await Author.collection.findOne({ _id: author._id });
    const res = await get();
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(["data", "pagination", "success"]);
    expect(res.body.pagination).toEqual({ page: 1, limit: 20, total: 1, pages: 1 });
    expect(res.body.data[0]).toEqual({
      id: author.id, firstName: "Karel", lastName: "Čapek", bio: "", country: "CZ", birthYear: 1890,
      website: "https://example.com", booksCount: 1,
      createdAt: stored.createdAt.toISOString(), updatedAt: stored.updatedAt.toISOString(),
    });
  });

  it("finds a surname prefix together with the exact country", async () => {
    const match = await createAuthor({ country: "CZ" });
    await createAuthor({ country: "SK" });
    await createAuthor({ firstName: "Jana", lastName: "Nováková", country: "CZ" });
    const res = await get("?search=%C4%8Dap&country=CZ");
    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([match.id]);
    expectView(res.body.data[0]);
    expect(ids(await get("?search=kArEl&country=CZ"))).toEqual([match.id]);
  });

  it("searches Cyrillic names without converting the result to Mongoose internals", async () => {
    const match = await createAuthor({ firstName: "Михаил", lastName: "Булгаков" });
    const res = await get(`?search=${encodeURIComponent("булг")}`);
    expect(ids(res)).toEqual([match.id]);
    expectView(res.body.data[0]);
  });

  it.each(["(", ".*"])("treats %s as literal search text", async (search) => {
    const match = await createAuthor({ lastName: `Name ${search}` });
    await createAuthor();
    const res = await get(`?search=${encodeURIComponent(search)}`);
    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([match.id]);
  });

  it.each(["firstName", "lastName", "birthYear", "createdAt", "-firstName", "-lastName", "-birthYear", "-createdAt"])(
    "pages tied %s values in stable id order", async (sortBy) => {
      const at = new Date("2000-01-01T00:00:00Z");
      const authors = Array.from({ length: 12 }, () => ({ _id: new mongoose.Types.ObjectId(), firstName: "Karel", lastName: "Čapek", birthYear: 1890, createdAt: at, updatedAt: at }));
      await Author.collection.insertMany(authors);
      const expected = authors.map((a) => String(a._id)).sort();
      if (sortBy.startsWith("-")) expected.reverse();
      const pages = await Promise.all([1, 2, 3].map((page) => get(`?page=${page}&limit=5&sortBy=${sortBy}`)));
      expect(pages.flatMap(ids)).toEqual(expected);
      expect(pages[0].body.pagination).toEqual({ page: 1, limit: 5, total: 12, pages: 3 });
    }
  );

  it("counts books in one batch for one and ten authors, and not for an empty page", async () => {
    const authors = await Author.create(Array.from({ length: 10 }, (_, i) => ({ firstName: `Name ${i}`, lastName: "Writer" })));
    await createBook({ author: authors[0]._id });
    const before = mongoose.get("debug");
    const commands = [];
    mongoose.set("debug", (collection, method) => { if (collection === "books") commands.push(method); });
    try {
      for (const limit of [1, 10]) {
        commands.length = 0;
        const res = await get(`?limit=${limit}`);
        expect(res.status).toBe(200);
        expect(commands).toEqual(["aggregate"]);
        for (const author of res.body.data) expect(author.booksCount).toBe(author.id === authors[0].id ? 1 : 0);
      }
      commands.length = 0;
      const res = await get("?page=30");
      expect(res.body.data).toEqual([]);
      expect(commands).toEqual([]);
    } finally { mongoose.set("debug", before); }
  });

  it("includes books from Book.author when the legacy array is wrong", async () => {
    const author = await createAuthor();
    const other = await createAuthor({ firstName: "Other" });
    const kept = await createBook({ author: author._id });
    const deleted = await createBook({ author: author._id });
    const moved = await createBook({ author: author._id });
    await Book.deleteOne({ _id: deleted._id });
    await Book.updateOne({ _id: moved._id }, { author: other._id });
    const res = await get(`/${author.id}?includeBooks=true`);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data).sort()).toEqual(["author", "books"]);
    expectView(res.body.data.author);
    expect(res.body.data.author.booksCount).toBe(1);
    expect(res.body.data.books.map((book) => book.id)).toEqual([kept.id]);
    expect(res.body.data.books[0].author.id).toBe(author.id);
    expect(res.body.data.books[0]).not.toHaveProperty("_id");
    for (const suffix of ["", "?includeBooks=false"]) {
      const detail = await get(`/${author.id}${suffix}`);
      expectView(detail.body.data);
      expect(detail.body.data.booksCount).toBe(1);
      expect(detail.body.data).not.toHaveProperty("books");
    }
    const list = await get(`/${author.id}/books`);
    expect(Object.keys(list.body).sort()).toEqual(["data", "success"]);
    expect(list.body.data.map((book) => book.id)).toEqual([kept.id]);
  });

  it("filters and sorts the author's books using the book view", async () => {
    const author = await createAuthor();
    await createBook({ author: author._id, title: "Out", inStock: false, price: 2 });
    await createBook({ author: author._id, title: "Higher", price: 10 });
    const book = await createBook({ author: author._id, title: "Lower", price: 5 });
    const res = await get(`/${author.id}/books?inStock=true&sortBy=price&limit=1`);
    expect(res.status).toBe(200);
    expect(res.body.data.map((row) => row.id)).toEqual([book.id]);
    expect(res.body.data[0].author).toEqual({ id: author.id, firstName: "Karel", lastName: "Čapek" });
  });

  it("returns country authors without count or internal fields", async () => {
    const author = await createAuthor({ country: "CZ" });
    const res = await get("/country/CZ");
    expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
    expect(ids(res)).toEqual([author.id]);
    expectView(res.body.data[0]);
  });

  it("returns statistics with an author view and the existing statistic types", async () => {
    const author = await createAuthor();
    await createBook({ author: author._id, category: "Fiction", price: 10, publicationYear: 2000 });
    await createBook({ author: author._id, category: "Poetry", price: 20, publicationYear: 2010, inStock: false });
    const res = await get(`/${author.id}/stats`);
    expectView(res.body.data.author);
    expect(res.body.data.statistics).toEqual({ totalBooks: 2, booksInStock: 1, booksOutOfStock: 1,
      categories: ["Fiction", "Poetry"], publicationYears: { earliest: 2000, latest: 2010 },
      pricing: { lowest: 10, highest: 20, average: "15.00" } });
  });

  it("returns null extrema for an author without books", async () => {
    const author = await createAuthor();
    const res = await get(`/${author.id}/stats`);
    expectView(res.body.data.author);
    expect(res.body.data.statistics).toEqual({ totalBooks: 0, booksInStock: 0, booksOutOfStock: 0, categories: [],
      publicationYears: { earliest: null, latest: null }, pricing: { lowest: null, highest: null, average: null } });
  });

  it.each(["/bad", "/bad/books", "/bad/stats"])("refuses a malformed id on %s", async (path) => {
    const res = await get(path);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: "VALIDATION_FAILED", fields: { id: "invalid_format" } });
  });
  it.each(["", "/books", "/stats"])("answers a valid missing id with 404 on %s", async (suffix) => {
    const res = await get(`/${MISSING}${suffix}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
  it.each([
    [`/${MISSING}?includeBooks=1`, "includeBooks"], [`/${MISSING}?includeBooks=true&includeBooks=false`, "includeBooks"],
    [`/${MISSING}?includeBooks[x]=true`, "includeBooks"], [`/${MISSING}?extra=1`, "extra"],
    [`/${MISSING}/books?inStock=1`, "inStock"], [`/${MISSING}/books?sortBy=__v`, "sortBy"],
    [`/${MISSING}/books?limit=101`, "limit"], [`/${MISSING}/books?limit=1&limit=2`, "limit"],
    [`/${MISSING}/books?extra=1`, "extra"], [`/${MISSING}/stats?extra=1`, "extra"],
    ["/country/CZ?extra=1", "extra"], ["?search[x]=a", "search"], ["?limit=101", "limit"],
  ])("validates the query on %s", async (path, field) => {
    const res = await get(path);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(res.body.error.fields).toHaveProperty(field);
  });
});
