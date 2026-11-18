import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../app.js";
import Author from "../../models/Author.js";
import Book from "../../models/Book.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAuthor, createBook } from "../helpers/factories.js";
import { meetingPoint } from "../helpers/race.js";

// An author is deleted only while it has no books, and a book is written only
// for an author that exists. In each race below both requests have checked
// before either writes (see race.js), so each check passes on its own
useTestDatabase();

let token;
let meeting;

beforeEach(async () => {
  token = await loginAs(app, await createUser({ role: "admin" }));
  meeting = meetingPoint();
});

afterEach(() => {
  // A failed test leaves no request waiting
  meeting.open();
  vi.restoreAllMocks();
});

const as = (req) => req.set("Authorization", `Bearer ${token}`);
const bookBody = (authorId, overrides = {}) => ({
  title: "Krakatit",
  authorId,
  publicationYear: 1924,
  category: "Fiction",
  priceMinor: 24990,
  ...overrides,
});
const postBook = (body) => as(request(app).post("/api/v1/books")).send(body);
const putBook = (id, body) => as(request(app).put(`/api/v1/books/${id}`)).send(body);
const deleteAuthor = (id) => as(request(app).delete(`/api/v1/authors/${id}`));
const getAuthor = async (id) => (await request(app).get(`/api/v1/authors/${id}`)).body.data;

// The titles of books whose author does not exist
const orphans = () =>
  Book.aggregate([
    { $lookup: { from: "authors", localField: "author", foreignField: "_id", as: "found" } },
    { $match: { found: { $size: 0 } } },
    { $project: { _id: 0, title: 1 } },
  ]);

describe("deleting an author while a book is written for it", () => {
  it("deleting an author while a book for it is created keeps the book and refuses the delete", async () => {
    const author = await createAuthor();
    meeting.before(Book, "create");
    meeting.after(Book, "countDocuments");

    const [created, deleted] = await Promise.all([
      meeting.track(postBook(bookBody(author.id))),
      meeting.track(deleteAuthor(author.id)),
    ]);

    expect([created.status, deleted.status]).toEqual([201, 409]);
    expect(deleted.body.error).toMatchObject({ code: "AUTHOR_HAS_BOOKS", details: { books: 1 } });
    expect(await Author.exists({ _id: author._id })).not.toBeNull();
    expect(await orphans()).toEqual([]);
  });

  it("deleting an author while a book moves to it keeps the move and refuses the delete", async () => {
    const from = await createAuthor();
    const to = await createAuthor({ firstName: "Josef" });
    const book = await createBook({ author: from._id, title: "Hordubal", publicationYear: 1933 });
    meeting.before(Book, "findByIdAndUpdate");
    meeting.after(Book, "countDocuments");

    const [moved, deleted] = await Promise.all([
      meeting.track(putBook(book.id, bookBody(to.id, { title: "Hordubal", publicationYear: 1933 }))),
      meeting.track(deleteAuthor(to.id)),
    ]);

    expect([moved.status, deleted.status]).toEqual([200, 409]);
    expect(deleted.body.error).toMatchObject({ code: "AUTHOR_HAS_BOOKS", details: { books: 1 } });
    expect(await Author.exists({ _id: to._id })).not.toBeNull();
    expect(await orphans()).toEqual([]);
  });
});

describe("book writes for one author", () => {
  it("two parallel creates of one title, author and year answer 201 and 409 on title", async () => {
    const author = await createAuthor();
    meeting.before(Book, "create");
    meeting.openOnRetry();

    const responses = await Promise.all(
      [1, 2].map(() => meeting.track(postBook(bookBody(author.id))))
    );

    expect(responses.map((res) => res.status).sort()).toEqual([201, 409]);
    expect(responses.find((res) => res.status === 409).body.error).toMatchObject({
      code: "CONFLICT",
      fields: { title: "duplicate" },
    });
    expect(await Book.countDocuments()).toBe(1);
  });

  it("adding or moving a book leaves the author's updatedAt and view as they were", async () => {
    const author = await createAuthor();
    const other = await createAuthor({ firstName: "Josef" });
    const before = await getAuthor(author.id);
    const otherBefore = await getAuthor(other.id);

    const created = await postBook(bookBody(author.id));

    expect(created.status).toBe(201);
    expect(await getAuthor(author.id)).toEqual({ ...before, booksCount: 1 });

    const moved = await putBook(created.body.data.id, bookBody(other.id));

    expect(moved.status).toBe(200);
    expect(await getAuthor(other.id)).toEqual({ ...otherBefore, booksCount: 1 });
  });
});
