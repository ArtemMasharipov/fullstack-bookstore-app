import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../../app.js";
import Author from "../../models/Author.js";
import Book from "../../models/Book.js";
import { authorBody } from "../../schemas/author.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAuthor, createBook } from "../helpers/factories.js";

useTestDatabase();
afterEach(() => vi.useRealTimers());
const names = { firstName: "Jane", lastName: "Writer" };

describe("author birth year at validation time", () => {
  it("moves both the schema and model bounds when the year changes after import", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2031, 0, 1));
    expect(authorBody.safeParse({ ...names, birthYear: 2031 }).success).toBe(true);
    expect(authorBody.safeParse({ ...names, birthYear: 2032 }).success).toBe(false);
    await expect(new Author({ ...names, birthYear: 2031 }).validate()).resolves.toBeUndefined();
    await expect(new Author({ ...names, birthYear: 2032 }).validate()).rejects.toThrow(/birthYear/);
    await expect(new Author({ ...names, birthYear: 1000.5 }).validate()).rejects.toThrow(/birthYear/);
  });

  it("creates and replaces an author in the new current year over HTTP", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2031, 0, 1));
    const token = await loginAs(app, await createUser({ role: "admin" }));
    const post = await request(app).post("/api/v1/authors").set("Authorization", `Bearer ${token}`).send({ ...names, birthYear: 2031 });
    expect(post.status).toBe(201);
    const put = await request(app).put(`/api/v1/authors/${post.body.data.id}`).set("Authorization", `Bearer ${token}`).send({ ...names, birthYear: 2031 });
    expect(put.status).toBe(200);
    expect(put.body.data.birthYear).toBe(2031);
    const refused = await request(app).put(`/api/v1/authors/${post.body.data.id}`).set("Authorization", `Bearer ${token}`).send({ ...names, birthYear: 2032 });
    expect(refused.status).toBe(400);
    expect(refused.body.error.fields.birthYear).toBe("too_big");
  });
});

describe("Book.author as the only stored relation", () => {
  it("does not add an array when creating, moving and deleting a book", async () => {
    const first = await createAuthor();
    const second = await createAuthor(names);
    const book = await createBook({ author: first._id });
    expect(await Author.collection.countDocuments({ books: { $exists: true } })).toBe(0);
    const count = async (id) => (await request(app).get(`/api/v1/authors/${id}`)).body.data.booksCount;
    expect(await count(first.id)).toBe(1);
    await Book.findByIdAndUpdate(book.id, { author: second._id });
    expect(await count(first.id)).toBe(0);
    expect(await count(second.id)).toBe(1);
    await Book.findByIdAndDelete(book.id);
    expect(await count(second.id)).toBe(0);
    expect(await Author.collection.countDocuments({ books: { $exists: true } })).toBe(0);
  });

  it("ignores old array data and removes it at the next author replacement", async () => {
    const author = await createAuthor();
    await Author.collection.updateOne({ _id: author._id }, { $set: { books: [author._id] } });
    const read = await request(app).get(`/api/v1/authors/${author.id}?includeBooks=true`);
    expect(read.body.data.books).toEqual([]);
    expect(read.body.data.author.booksCount).toBe(0);
    const token = await loginAs(app, await createUser({ role: "admin" }));
    const put = await request(app).put(`/api/v1/authors/${author.id}`).set("Authorization", `Bearer ${token}`).send(names);
    expect(put.status).toBe(200);
    expect(await Author.collection.findOne({ _id: author._id })).not.toHaveProperty("books");
  });
});
