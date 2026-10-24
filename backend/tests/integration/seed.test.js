import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import app from "../../app.js";
import Author from "../../models/Author.js";
import Book from "../../models/Book.js";
import Cart from "../../models/Cart.js";
import User from "../../models/User.js";
import { SMOKE_BOOK_TITLE } from "../../scripts/seed-data.js";
import { seed } from "../../scripts/seed.js";
import { createUser } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAuthor } from "../helpers/factories.js";

// seed() fills a database with demo users, authors and books for
// layout checks and the e2e smoke test. The CLI around it is seed-cli.test.js.
useTestDatabase();

const passwords = {
  adminPassword: "Cedar lantern 47!",
  userPassword: "Velvet compass 92!",
};

const SEEDED = { users: 2, authors: 5, books: 24 };

const countDocuments = async () => ({
  users: await User.countDocuments(),
  authors: await Author.countDocuments(),
  books: await Book.countDocuments(),
});

const login = (emailOrUsername, password) =>
  request(app).post("/api/v1/auth/login").send({ emailOrUsername, password });

// Runs fn while mongoose reports a host that is not local. The connection is
// still the in-memory one: only what assertLocalConnection reads is changed.
async function asRemote(fn) {
  const realHost = mongoose.connection.host;
  mongoose.connection.host = "db.example.com";
  try {
    return await fn();
  } finally {
    mongoose.connection.host = realHost;
  }
}

describe("seed()", () => {
  it("creates 2 users (one of them admin), 5 authors and 24 books", async () => {
    const result = await seed(passwords);

    expect(result).toEqual(SEEDED);
    expect(await countDocuments()).toEqual(SEEDED);
    expect(await User.countDocuments({ role: "admin" })).toBe(1);
  });

  it("stores the relation only on each book", async () => {
    await seed(passwords);

    expect(await Author.collection.countDocuments({ books: { $exists: true } })).toBe(0);
    const books = await Book.find().lean();
    expect(books).toHaveLength(24);
    const ids = (await Author.find().lean()).map((author) => String(author._id));
    for (const book of books) expect(ids).toContain(String(book.author));
  });

  it("makes the book the smoke test looks for the newest one", async () => {
    await seed(passwords);

    // _id breaks the tie of two books created in the same millisecond
    const newest = await Book.findOne().sort({ createdAt: -1, _id: -1 });

    expect(newest.title).toBe(SMOKE_BOOK_TITLE);
  });

  it("creates the books one at a time: createdAt follows the list", async () => {
    // createdAt does not show it reliably (books created in the same
    // millisecond share one), so count the Book.create calls in flight at once
    const create = Book.create.bind(Book);
    let started = 0;
    let running = 0;
    let mostAtOnce = 0;
    const spy = vi.spyOn(Book, "create").mockImplementation(async (...args) => {
      started += 1;
      running += 1;
      mostAtOnce = Math.max(mostAtOnce, running);
      try {
        return await create(...args);
      } finally {
        running -= 1;
      }
    });

    try {
      await seed(passwords);
    } finally {
      spy.mockRestore();
    }

    expect(started).toBe(24);
    expect(mostAtOnce).toBe(1);
  });

  it("writes nothing, and with reset deletes nothing, when a password is invalid", async () => {
    // Shorter than the 15 codepoints required by the shared policy. The reader is the
    // second user: without the check up front the admin would already be saved.
    const invalid = { adminPassword: "Cedar lantern 47!", userPassword: "123" };

    await expect(seed(invalid)).rejects.toThrow(/password/i);
    expect(await countDocuments()).toEqual({ users: 0, authors: 0, books: 0 });

    await seed(passwords);
    await expect(seed({ ...invalid, reset: true })).rejects.toThrow(
      /password/i
    );
    expect(await countDocuments()).toEqual(SEEDED);
  });

  it("lets the admin and the reader log in with the given passwords", async () => {
    await seed(passwords);

    const admin = await login("admin@bookstore.local", "Cedar lantern 47!");
    expect(admin.status).toBe(200);
    expect(admin.body.data.user.role).toBe("admin");

    const reader = await login("reader@bookstore.local", "Velvet compass 92!");
    expect(reader.status).toBe(200);
    expect(reader.body.data.user.role).toBe("user");
  });
});

describe("seed() on a database that is already seeded", () => {
  it("refuses without reset and adds nothing", async () => {
    await seed(passwords);

    await expect(seed(passwords)).rejects.toThrow(/already seeded/);

    expect(await countDocuments()).toEqual(SEEDED);
  });

  it("replaces the users, authors and books with reset, and touches no other collection", async () => {
    await seed(passwords);
    const stranger = await createUser();
    const strangerAuthor = await createAuthor();
    await Book.create({
      title: "Not from the seed",
      author: strangerAuthor.id,
      publicationYear: 2000,
      price: 10,
    });
    await Cart.create({ user: stranger.id });

    const result = await seed({ ...passwords, reset: true });

    expect(result).toEqual(SEEDED);
    // Not 3 users, 6 authors, 25 books: the old documents are gone
    expect(await countDocuments()).toEqual(SEEDED);
    expect(await User.exists({ _id: stranger.id })).toBeNull();
    expect(await Book.exists({ title: "Not from the seed" })).toBeNull();
    expect(await Cart.countDocuments()).toBe(1);
  });
});

describe("seed() on a connection that is not local", () => {
  it("refuses reset and deletes nothing", async () => {
    await seed(passwords);

    await asRemote(async () => {
      await expect(seed({ ...passwords, reset: true })).rejects.toThrow(
        /non-local MongoDB/
      );
    });

    expect(await countDocuments()).toEqual(SEEDED);
  });

  it("still seeds without reset: the guard is for reset only, and the CLI allows this with SEED_ALLOW_REMOTE=true", async () => {
    const result = await asRemote(() => seed(passwords));

    expect(result).toEqual(SEEDED);
    expect(await countDocuments()).toEqual(SEEDED);
  });
});

describe("seed data", () => {
  it("covers the catalogue layout cases", async () => {
    await seed(passwords);
    const books = await Book.find().lean();
    const titles = books.map((book) => book.title);
    const withoutCover = books.filter((book) => !book.image);
    const longTitles = titles.filter((t) => t.length >= 90 && t.length <= 100);
    const cyrillicTitles = titles.filter((t) => /\p{Script=Cyrillic}/u.test(t));
    const czechTitles = titles.filter((t) => /[ěščřžůďťň]/i.test(t));

    expect(await Book.countDocuments({ inStock: false })).toBe(1);
    expect(withoutCover.length).toBeGreaterThanOrEqual(3);
    expect(longTitles).toHaveLength(1);
    expect(cyrillicTitles).toEqual(["Мастер и Маргарита"]);
    expect(czechTitles.length).toBeGreaterThanOrEqual(3);
  });

  it("gives every cover as a small data: URI, so nothing is requested from the network", async () => {
    await seed(passwords);
    const covers = (await Book.find().lean())
      .map((book) => book.image)
      .filter(Boolean);

    expect(covers.length).toBeGreaterThanOrEqual(10);
    for (const cover of covers) {
      expect(cover).toMatch(/^data:image\/svg\+xml,/);
      expect(cover.length).toBeLessThan(1000);

      const markup = decodeURIComponent(cover.slice(cover.indexOf(",") + 1));
      // The namespace in xmlns is an identifier, not a request
      const svg = markup.replace('xmlns="http://www.w3.org/2000/svg"', "");
      expect(svg).toMatch(/^<svg /);
      expect(svg).not.toMatch(/https?:|href|url\(|<image|<script/i);
    }
  });
});
