/**
 * Book price migration to whole geller (expand and contract)
 *
 * Book prices are stored in crowns as floats. migrateUp() adds priceMinor, the
 * same price in whole geller (1/100 CZK), next to price, which stays as it is:
 * the running app and an older one keep reading price, so either works on the
 * migrated books, and migrateDown() only removes priceMinor again. A marker in
 * the migrations collection records that every book had priceMinor after up.
 * Prices that are not whole geller are refused before anything is written.
 *
 * Every function works on the books of a mongoose connection, through its
 * native collections: priceMinor is not part of the Book schema yet.
 */

import mongoose from "mongoose";
import { toMinorUnits } from "./pricing.js";

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

  const after = await books
    .find({ _id: { $in: pending.map(({ _id }) => _id) } }, { projection: { price: 1, priceMinor: 1 } })
    .toArray();
  const skipped = after
    .filter(({ price, priceMinor }) => priceMinor !== toMinorUnits(price))
    .map(({ _id }) => _id.toString());

  if (skipped.length === 0) {
    await markers.updateOne(
      { _id: MARKER_ID },
      { $setOnInsert: { version: MARKER_VERSION, appliedAt: new Date() } },
      { upsert: true }
    );
  }
  return {
    updated: pending.length - skipped.length,
    skipped,
    alreadyApplied: marked && pending.length === 0,
  };
}

/**
 * Removes priceMinor from every book and the marker; price was never changed
 * @returns {{ reverted: number }}
 */
export async function migrateDown(connection = mongoose.connection) {
  const result = await connection
    .collection("books")
    .updateMany({ priceMinor: { $exists: true } }, { $unset: { priceMinor: "" } });
  await connection.collection("migrations").deleteOne({ _id: MARKER_ID });
  return { reverted: result.modifiedCount };
}
