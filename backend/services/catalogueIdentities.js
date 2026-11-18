/**
 * Catalogue identity preflight
 *
 * An author's name is unique under IDENTITY_COLLATION (see models/collation.js):
 * names that differ only in case are one name. A unique index cannot be built
 * over documents that already break that rule, and without it the server does
 * not start. findIdentityCollisions() lists those documents with what an owner
 * needs to settle each case by hand.
 *
 * It only reads, through native collections: it builds no index, creates no
 * collection and also sees documents the current models would reject.
 */

import mongoose from "mongoose";
import { IDENTITY_COLLATION } from "../models/collation.js";

const byId = (left, right) => left.id.localeCompare(right.id);

// The groups of authors with one name under the collation, each with the
// number of books of every author in it
async function authorCollisions(db) {
  const authors = db.collection("authors");
  const groups = await authors
    .aggregate(
      [
        {
          $group: {
            _id: { firstName: "$firstName", lastName: "$lastName" },
            authors: { $push: { _id: "$_id", firstName: "$firstName", lastName: "$lastName" } },
          },
        },
        { $match: { "authors.1": { $exists: true } } },
      ],
      { collation: IDENTITY_COLLATION }
    )
    .toArray();

  const ids = groups.flatMap((group) => group.authors.map((author) => author._id));
  const counts = ids.length
    ? await db
        .collection("books")
        .aggregate([{ $match: { author: { $in: ids } } }, { $group: { _id: "$author", count: { $sum: 1 } } }])
        .toArray()
    : [];
  const books = new Map(counts.map(({ _id, count }) => [String(_id), count]));

  const collisions = groups
    .map((group) => ({
      authors: group.authors
        .map(({ _id, firstName, lastName }) => ({
          id: String(_id),
          firstName,
          lastName,
          books: books.get(String(_id)) ?? 0,
        }))
        .sort(byId),
    }))
    .sort((left, right) => byId(left.authors[0], right.authors[0]));

  return { total: await authors.countDocuments(), collisions };
}

/**
 * @returns {{ collation: Object, authors: { total: number, collisions: { authors: Object[] }[] } }}
 */
export async function findIdentityCollisions(connection = mongoose.connection) {
  return { collation: IDENTITY_COLLATION, authors: await authorCollisions(connection.db) };
}
