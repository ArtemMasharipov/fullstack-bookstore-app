import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { ensureIndexes } from "../../config/database.js";
import { seed } from "../../scripts/seed.js";
import { findIdentityCollisions } from "../../services/catalogueIdentities.js";
import { useTestDatabase } from "../helpers/db.js";

// The preflight of npm run check:identities, on the test database. The CLI
// around it is check-identities-cli.test.js
useTestDatabase();

// A test that stores duplicates first drops the unique index that refuses
// them; the next one starts with every declared index again
beforeEach(async () => {
  await ensureIndexes();
});

const CZECH = { locale: "cs", strength: 2 };
const passwords = { adminPassword: "Cedar lantern 47!", userPassword: "Velvet compass 92!" };
const collection = (name) => mongoose.connection.collection(name);

// Every collection name, document and index, so a write of any kind shows
async function snapshot() {
  const names = (await mongoose.connection.db.listCollections().toArray()).map(({ name }) => name).sort();
  const contents = await Promise.all(
    names.map(async (name) => ({
      name,
      documents: await collection(name).find().sort({ _id: 1 }).toArray(),
      indexes: await collection(name).indexes(),
    }))
  );
  return mongoose.mongo.BSON.EJSON.stringify(contents, { relaxed: false });
}

describe("catalogue identity preflight", () => {
  it("reports no collisions on the seed data", async () => {
    await seed(passwords);

    expect(await findIdentityCollisions()).toEqual({
      collation: CZECH,
      authors: { total: 5, collisions: [] },
      books: { total: 24, collisions: [] },
    });
  });

  it("reports a case-variant author pair with ids, names and book counts, and changes nothing", async () => {
    await collection("authors").dropIndex("firstName_lastName_cs2_unique");
    const { insertedIds: ids } = await collection("authors").insertMany([
      { firstName: "Karel", lastName: "Čapek" },
      { firstName: "KAREL", lastName: "čapek" },
      { firstName: "Karel", lastName: "Capek" },
    ]);
    await collection("books").insertMany([
      { title: "R.U.R.", author: ids[0], publicationYear: 1920 },
      { title: "Krakatit", author: ids[0], publicationYear: 1924 },
      { title: "Hordubal", author: ids[2], publicationYear: 1933 },
    ]);
    const before = await snapshot();

    const report = await findIdentityCollisions();

    expect(report.authors).toEqual({
      total: 3,
      collisions: [
        {
          authors: [
            { id: String(ids[0]), firstName: "Karel", lastName: "Čapek", books: 2 },
            { id: String(ids[1]), firstName: "KAREL", lastName: "čapek", books: 0 },
          ],
        },
      ],
    });
    expect(await snapshot()).toBe(before);
  });

  // A unique index stores a missing field as null, so these two are one name to it
  it("reports a missing and a null first name of one last name as one name, as the index does", async () => {
    await collection("authors").dropIndex("firstName_lastName_cs2_unique");
    const { insertedIds: ids } = await collection("authors").insertMany([
      { lastName: "Xyz" },
      { firstName: null, lastName: "Xyz" },
    ]);

    const report = await findIdentityCollisions();

    expect(report.authors.collisions).toEqual([
      {
        authors: [
          { id: String(ids[0]), firstName: undefined, lastName: "Xyz", books: 0 },
          { id: String(ids[1]), firstName: null, lastName: "Xyz", books: 0 },
        ],
      },
    ]);
    const build = await ensureIndexes().then(() => "built", (error) => error.cause?.code);
    expect(build).toBe(11000);
  });

  it("reports a case-variant title of one author and year, and changes nothing", async () => {
    await collection("books").dropIndex("author_title_publicationYear_cs2_unique");
    const [capek, hasek] = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
    const { insertedIds: ids } = await collection("books").insertMany([
      { title: "R.U.R.", author: capek, publicationYear: 1920 },
      { title: "r.u.r.", author: capek, publicationYear: 1920 },
      // Another year, another author, other diacritics: other books
      { title: "R.U.R.", author: capek, publicationYear: 1921 },
      { title: "R.U.R.", author: hasek, publicationYear: 1920 },
      { title: "Válka s mloky", author: capek, publicationYear: 1936 },
      { title: "Valka s mloky", author: capek, publicationYear: 1936 },
    ]);
    const before = await snapshot();

    const report = await findIdentityCollisions();

    expect(report.books).toEqual({
      total: 6,
      collisions: [
        {
          author: String(capek),
          publicationYear: 1920,
          books: [
            { id: String(ids[0]), title: "R.U.R." },
            { id: String(ids[1]), title: "r.u.r." },
          ],
        },
      ],
    });
    expect(await snapshot()).toBe(before);
  });
});
