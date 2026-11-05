/**
 * Book price migration to whole geller (expand and contract)
 *
 * Book prices are stored in crowns as floats. migrateUp() adds priceMinor, the
 * same price in whole geller (1/100 CZK), next to price, which stays as it is:
 * the previous release keeps reading price, and the current one reads priceMinor
 * with a fallback for legacy books. migrateDown() only removes priceMinor. A marker in
 * the migrations collection records that every book had priceMinor after up.
 * Prices that are not whole geller are refused before anything is written.
 *
 * Stop older writers and rerun migrateUp() before switching canonical reads on,
 * including after a rollback: an older writer can leave an existing priceMinor stale.
 * Every function uses native collections to include legacy documents and preserve
 * their BSON types in backups.
 */

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { assertLocalConnection } from "../config/mongo-guard.js";
import { toMinorUnits } from "./pricing.js";

// Canonical Extended JSON of unpromoted documents keeps every BSON type
// (Double, Int32, Long), so a restore gives back the documents exactly; it
// comes with the MongoDB driver Mongoose uses
const { EJSON } = mongoose.mongo.BSON;

export const MARKER_ID = "book-price-minor-units";
const MARKER_VERSION = 1;
const MAX_PRICE = 999999.99;

export class MigrationRefused extends Error {
  constructor(message, details) {
    super(message);
    this.name = "MigrationRefused";
    this.details = details;
  }
}

// Why a stored price cannot be written as whole geller, or null
function priceProblem(price) {
  if (typeof price !== "number" || !Number.isFinite(price)) return "not a finite number";
  if (price < 0) return "negative";
  if (price > MAX_PRICE) return `above ${MAX_PRICE}`;
  // The float noise of a price entered with two decimals disappears at 12
  // significant digits; anything else is more precise than a geller
  if (Number((toMinorUnits(price) / 100).toPrecision(12)) !== Number(price.toPrecision(12))) {
    return "not whole geller";
  }
  return null;
}

/**
 * Every book whose price cannot become whole geller, with the reason
 * @returns {{ total: number, unsupported: { id: string, price: unknown, reason: string }[] }}
 */
export async function preflight(connection = mongoose.connection) {
  const books = await connection
    .collection("books")
    .find({}, { projection: { price: 1 } })
    .toArray();
  const unsupported = books.flatMap(({ _id, price }) => {
    const reason = priceProblem(price);
    return reason ? [{ id: _id.toString(), price, reason }] : [];
  });
  return { total: books.length, unsupported };
}

/**
 * Sets priceMinor on every book that lacks it or has a stale one. A book whose
 * price changed between reading and writing is left out and reported; the
 * next run covers it, and the marker is written only when no book is left.
 * @returns {{ updated: number, skipped: string[], alreadyApplied: boolean }}
 */
export async function migrateUp(connection = mongoose.connection) {
  const { unsupported } = await preflight(connection);
  if (unsupported.length > 0) {
    throw new MigrationRefused("Some book prices are not whole geller", { unsupported });
  }

  const books = connection.collection("books");
  const markers = connection.collection("migrations");
  const marked = (await markers.findOne({ _id: MARKER_ID })) !== null;

  const pending = (await books.find({}, { projection: { price: 1, priceMinor: 1 } }).toArray()).filter(
    ({ price, priceMinor }) => priceMinor !== toMinorUnits(price)
  );
  if (pending.length > 0) {
    await books.bulkWrite(
      pending.map(({ _id, price }) => ({
        updateOne: { filter: { _id, price }, update: { $set: { priceMinor: toMinorUnits(price) } } },
      })),
      { ordered: false }
    );
  }

  // The marker claims that every book carries its priceMinor, so all books are
  // checked after the writes: a book changed or added meanwhile keeps it off
  const after = await books.find({}, { projection: { price: 1, priceMinor: 1 } }).toArray();
  const skipped = after
    .filter(({ price, priceMinor }) => priceProblem(price) !== null || priceMinor !== toMinorUnits(price))
    .map(({ _id }) => _id.toString());

  if (skipped.length === 0) {
    await markers.updateOne(
      { _id: MARKER_ID },
      { $setOnInsert: { version: MARKER_VERSION, appliedAt: new Date() } },
      { upsert: true }
    );
  } else {
    await markers.deleteOne({ _id: MARKER_ID });
  }
  return {
    updated: pending.filter(({ _id }) => !skipped.includes(_id.toString())).length,
    skipped,
    alreadyApplied: marked && pending.length === 0,
  };
}

/**
 * Removes priceMinor from every book and the marker; price was never changed
 * @returns {{ reverted: number }}
 */
export async function migrateDown(connection = mongoose.connection) {
  // The marker goes first: an interrupted run must not leave it claiming
  // priceMinor on books that lost it
  await connection.collection("migrations").deleteOne({ _id: MARKER_ID });
  const result = await connection
    .collection("books")
    .updateMany({ priceMinor: { $exists: true } }, { $unset: { priceMinor: "" } });
  return { reverted: result.modifiedCount };
}

/**
 * Writes every book to a new file books-<UTC time>.json in dir
 * @returns {{ file: string, count: number }}
 */
export async function backup(dir, connection = mongoose.connection) {
  const documents = await connection
    .collection("books")
    .find({}, { promoteValues: false })
    .sort({ _id: 1 })
    .toArray();
  const exportedAt = new Date().toISOString();
  await fs.promises.mkdir(dir, { recursive: true });
  const file = path.join(dir, `books-${exportedAt.replaceAll(":", "-")}.json`);
  const payload = { collection: "books", exportedAt, count: documents.length, documents };
  await fs.promises.writeFile(file, `${EJSON.stringify(payload, undefined, 2, { relaxed: false })}\n`, {
    flag: "wx",
  });
  return { file, count: documents.length };
}

/**
 * Replaces all books with those of a backup file, in one transaction: a failure
 * leaves the books as they were. The marker stays only if the restored books
 * all carry their priceMinor.
 * @returns {{ restored: number }}
 */
export async function restore(file, connection = mongoose.connection) {
  // Deleting every book is refused on a database that is not local, whoever
  // calls this, as for the seed reset
  assertLocalConnection(connection);
  let payload;
  try {
    payload = EJSON.parse(await fs.promises.readFile(file, "utf8"), { relaxed: false });
  } catch {
    throw new MigrationRefused("Not a readable books backup", { file });
  }
  const documents = payload?.documents;
  if (
    payload?.collection !== "books" ||
    !Array.isArray(documents) ||
    Number(payload.count) !== documents.length ||
    !documents.every((document) => document?._id !== undefined)
  ) {
    throw new MigrationRefused("Not a books backup", { file });
  }

  const migrated = documents.every(
    ({ price, priceMinor }) => Number(priceMinor) === toMinorUnits(Number(price))
  );
  await connection.transaction(async (session) => {
    const books = connection.collection("books");
    await books.deleteMany({}, { session });
    if (documents.length > 0) await books.insertMany(documents, { session });
    if (!migrated) await connection.collection("migrations").deleteOne({ _id: MARKER_ID }, { session });
  });
  return { restored: documents.length };
}
