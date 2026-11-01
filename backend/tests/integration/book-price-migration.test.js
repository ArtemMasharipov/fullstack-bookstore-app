import mongoose from "mongoose";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../../app.js";
import {
  MARKER_ID,
  MigrationRefused,
  migrateDown,
  migrateUp,
  preflight,
} from "../../services/bookPriceMigration.js";
import { toMinorUnits } from "../../services/pricing.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createBook } from "../helpers/factories.js";

useTestDatabase();

afterEach(() => {
  vi.restoreAllMocks();
});

const books = () => mongoose.connection.collection("books");
const marker = () => mongoose.connection.collection("migrations").findOne({ _id: MARKER_ID });
const snapshot = async () =>
  mongoose.mongo.BSON.EJSON.stringify(await books().find({}).sort({ _id: 1 }).toArray(), {
    relaxed: false,
  });

// Writes a price as it is, past the model's validation: the migration has to
// cope with whatever is stored
const storePrice = (id, price) => books().updateOne({ _id: id }, { $set: { price } });

// mulberry32: a seeded generator, so a failing run can be replayed
function seeded(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("book price migration: up and down", () => {
  it("adds whole geller next to every price, and down leaves the books exactly as they were", async () => {
    const template = (await createBook()).toObject();
    await books().deleteMany({});
    const next = seeded(4242);
    const prices = [0, 999999.99, ...Array.from({ length: 198 }, () => Math.floor(next() * 100000000) / 100)];
    await books().insertMany(
      prices.map((price, index) => ({
        ...template,
        _id: new mongoose.Types.ObjectId(),
        title: `Book ${index}`,
        price,
      }))
    );
    const before = await snapshot();

    await migrateUp();
    const migrated = await books().find({}).toArray();

    expect(migrated).toHaveLength(200);
    expect(migrated.every((book) => book.priceMinor === toMinorUnits(book.price))).toBe(true);
    expect(await marker()).toMatchObject({ version: 1 });

    await migrateDown();

    expect(await snapshot()).toBe(before);
    expect(await marker()).toBeNull();
  });

  it("reads a price with float noise as the geller it was entered with", async () => {
    const book = await createBook();
    await storePrice(book._id, 249.89999999999998);

    await migrateUp();

    expect((await books().findOne({ _id: book._id })).priceMinor).toBe(24990);
  });

  it("leaves the cart total as it was, after up and after down", async () => {
    const token = await loginAs(app, await createUser());
    const as = (req) => req.set("Authorization", `Bearer ${token}`);
    for (const price of [199, 249.9, 0.5]) {
      const bookId = (await createBook({ price }))._id.toString();
      await as(request(app).post("/api/v1/cart")).send({ bookId, quantity: 2 });
    }
    const total = async () => (await as(request(app).get("/api/v1/cart"))).body.data.quote.total;
    const before = await total();

    await migrateUp();
    expect(await total()).toBe(before);

    await migrateDown();
    expect(await total()).toBe(before);
  });

  it("refuses prices that are not whole geller before writing anything", async () => {
    await createBook({ price: 10 });
    const refused = [];
    for (const price of [199.999, -1, Number.NaN, 1e7]) {
      const book = await createBook();
      await storePrice(book._id, price);
      refused.push(book._id.toString());
    }
    const before = await snapshot();

    const { total, unsupported } = await preflight();

    expect(total).toBe(5);
    expect(unsupported.map(({ id }) => id).sort()).toEqual([...refused].sort());
    expect(unsupported.every(({ reason }) => typeof reason === "string" && reason !== "")).toBe(true);
    await expect(migrateUp()).rejects.toBeInstanceOf(MigrationRefused);
    expect(await snapshot()).toBe(before);
    expect(await marker()).toBeNull();
  });

  it("runs again without changes, and a later up also covers books added since", async () => {
    await createBook({ price: 12.5 });

    expect(await migrateUp()).toMatchObject({ updated: 1, skipped: [], alreadyApplied: false });
    expect(await migrateUp()).toMatchObject({ updated: 0, skipped: [], alreadyApplied: true });

    const added = await createBook({ price: 7 });
    expect(await migrateUp()).toMatchObject({ updated: 1, skipped: [], alreadyApplied: false });
    expect((await books().findOne({ _id: added._id })).priceMinor).toBe(700);

    expect(await migrateDown()).toEqual({ reverted: 2 });
    expect(await migrateDown()).toEqual({ reverted: 0 });
  });

  it("leaves a book whose price changed meanwhile for the next run", async () => {
    const changed = await createBook({ price: 100 });
    const other = await createBook({ price: 50 });
    const collection = books();
    const bulkWrite = collection.bulkWrite.bind(collection);
    vi.spyOn(collection, "bulkWrite").mockImplementationOnce(async (...args) => {
      await storePrice(changed._id, 120);
      return bulkWrite(...args);
    });

    const result = await migrateUp();

    expect(result.skipped).toEqual([changed._id.toString()]);
    expect(await books().findOne({ _id: changed._id })).not.toHaveProperty("priceMinor");
    expect((await books().findOne({ _id: other._id })).priceMinor).toBe(5000);
    expect(await marker()).toBeNull();

    expect(await migrateUp()).toMatchObject({ updated: 1, skipped: [] });
    expect((await books().findOne({ _id: changed._id })).priceMinor).toBe(12000);
  });
});
