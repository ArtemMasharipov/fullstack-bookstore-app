import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../app.js";
import Book from "../../models/Book.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAuthor, createBook } from "../helpers/factories.js";

// One book per title, author and year. The title is compared as an author's
// name is: without case but with diacritics (see models/collation.js)
useTestDatabase();

const DUPLICATE = { code: "CONFLICT", fields: { title: "duplicate" } };

let token;
let author;

beforeEach(async () => {
  token = await loginAs(app, await createUser({ role: "admin" }));
  author = await createAuthor();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const bookBody = (overrides = {}) => ({
  title: "R.U.R.",
  authorId: author.id,
  publicationYear: 1920,
  category: "Drama",
  priceMinor: 19900,
  ...overrides,
});
const send = (method, path, body) =>
  request(app)[method](`/api/v1/books${path}`).set("Authorization", `Bearer ${token}`).send(body);

describe("one book per title, author and year", () => {
  it("refuses a title that differs only in case for the same author and year, on create and update", async () => {
    await createBook({ author: author._id });
    const other = await createBook({ author: author._id, title: "Krakatit" });

    const created = await send("post", "", bookBody({ title: "r.u.r." }));
    const changed = await send("put", `/${other.id}`, bookBody({ title: "R.u.R." }));

    expect([created.status, changed.status]).toEqual([409, 409]);
    expect(created.body.error).toMatchObject(DUPLICATE);
    expect(changed.body.error).toMatchObject(DUPLICATE);
    expect(await Book.countDocuments()).toBe(2);
    expect((await Book.findById(other.id).lean()).title).toBe("Krakatit");
  });

  it("a title that differs in diacritics is another book", async () => {
    await createBook({ author: author._id, title: "Válka s mloky", publicationYear: 1936 });

    const res = await send("post", "", bookBody({ title: "Valka s mloky", publicationYear: 1936 }));

    expect(res.status).toBe(201);
  });

  it("lets a book change the case of its own title", async () => {
    const book = await createBook({ author: author._id });

    const res = await send("put", `/${book.id}`, bookBody({ title: "r.u.r." }));

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("r.u.r.");
  });

  it("a duplicate book the fast path misses still answers 409 on title", async () => {
    await createBook({ author: author._id });
    vi.spyOn(Book, "exists").mockResolvedValueOnce(null);

    const res = await send("post", "", bookBody());

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject(DUPLICATE);
    expect(await Book.countDocuments()).toBe(1);
  });
});
