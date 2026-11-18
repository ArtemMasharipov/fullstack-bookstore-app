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
});
