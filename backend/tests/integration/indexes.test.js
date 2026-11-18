import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { ensureIndexes } from "../../config/database.js";
import Author from "../../models/Author.js";
import Book from "../../models/Book.js";
import Order from "../../models/Order.js";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();

const CZECH = { locale: "cs", strength: 2 };
const AUTHOR_NAME_INDEX = "firstName_lastName_cs2_unique";
const BOOK_IDENTITY_INDEX = "author_title_publicationYear_cs2_unique";
const indexNames = async (model) => (await model.collection.indexes()).map((index) => index.name);

// Mongoose builds indexes in the background, one after another, and does not
// wait for them before queries run. An order is placed once per key only
// because of a unique index, so the app must not take requests before it exists.
it("builds every declared index, whatever the background build has done", async () => {
  await Order.init();
  await Order.collection.dropIndexes();

  await ensureIndexes();

  const indexes = await Order.collection.indexes();
  expect(indexes.find((index) => index.name === "user_1_idempotencyKey_1")).toMatchObject({
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  });
  expect(indexes.map((index) => index.name)).toContain("orderNumber_1");
});

// One author per name, without regard to case (see models/collation.js)
describe("the author name index", () => {
  it("builds the unique author name index with Czech collation, strength 2", async () => {
    await Author.init();
    await Author.collection.dropIndexes();

    await ensureIndexes();

    const indexes = await Author.collection.indexes();
    expect(indexes.find((index) => index.name === AUTHOR_NAME_INDEX)).toMatchObject({
      key: { firstName: 1, lastName: 1 },
      unique: true,
      collation: CZECH,
    });
    expect(indexes.map((index) => index.name)).not.toContain("firstName_1_lastName_1");
  });

  // The previous release declared { firstName: 1, lastName: 1 } under its
  // automatic name; the same name with other options would refuse to build
  it("builds it next to the previous release's firstName_1_lastName_1", async () => {
    await Author.init();
    await Author.collection.dropIndexes();
    await Author.collection.createIndex({ firstName: 1, lastName: 1 });

    await ensureIndexes();

    expect(await indexNames(Author)).toEqual(
      expect.arrayContaining(["firstName_1_lastName_1", AUTHOR_NAME_INDEX])
    );
  });

  it("refuses to build it over existing duplicates, names the preflight and changes no document", async () => {
    await Author.init();
    await Author.collection.dropIndex(AUTHOR_NAME_INDEX);
    await Author.collection.insertMany([
      { firstName: "Karel", lastName: "Čapek" },
      { firstName: "karel", lastName: "čapek" },
    ]);

    const refusal = await ensureIndexes().then(() => null, (error) => error);

    expect(refusal).toBeInstanceOf(Error);
    expect(refusal.message).toContain("npm run check:identities");
    expect(refusal.message).not.toContain("CollationKey");
    expect(refusal.cause.code).toBe(11000);
    expect(await Author.countDocuments()).toBe(2);
    expect(await indexNames(Author)).not.toContain(AUTHOR_NAME_INDEX);
  });
});

// One book per title, author and year, the title compared as a name is
describe("the book identity index", () => {
  it("builds the unique book identity index with the same collation", async () => {
    await Book.init();
    await Book.collection.dropIndexes();

    await ensureIndexes();

    const indexes = await Book.collection.indexes();
    expect(indexes.find((index) => index.name === BOOK_IDENTITY_INDEX)).toMatchObject({
      key: { author: 1, title: 1, publicationYear: 1 },
      unique: true,
      collation: CZECH,
    });
  });

  it("refuses to build it over existing duplicates, names the preflight and changes no document", async () => {
    await Book.init();
    await Book.collection.dropIndex(BOOK_IDENTITY_INDEX);
    const author = new mongoose.Types.ObjectId();
    await Book.collection.insertMany([
      { title: "R.U.R.", author, publicationYear: 1920 },
      { title: "r.u.r.", author, publicationYear: 1920 },
    ]);

    const refusal = await ensureIndexes().then(() => null, (error) => error);

    expect(refusal).toBeInstanceOf(Error);
    expect(refusal.message).toContain("books");
    expect(refusal.message).toContain("npm run check:identities");
    expect(refusal.cause.code).toBe(11000);
    expect(await Book.countDocuments()).toBe(2);
    expect(await indexNames(Book)).not.toContain(BOOK_IDENTITY_INDEX);
  });
});
