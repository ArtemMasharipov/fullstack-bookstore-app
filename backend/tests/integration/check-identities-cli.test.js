import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { assertLocalMongoUri } from "../../config/mongo-guard.js";
import { childEnv } from "../helpers/process.js";

// The catalogue identity check (npm run check:identities) runs in a child
// process, like the other CLIs; its preflight is identity-preflight.test.js
const cliPath = fileURLToPath(new URL("../../scripts/check-identities.js", import.meta.url));

// The CLI imports config/default.js, which needs a JWT_SECRET; childEnv drops
// the one of this machine
const JWT_SECRET = "identity-cli-test-secret-0123456789abcdef0123456789";
const REMOTE_URI = "mongodb://db.example.com/shop";

// Database names get a suffix of their own per run (see seed-cli.test.js)
const RUN = randomUUID().slice(0, 8);

// A working directory without a .env, so nothing but the given environment
// reaches the process
let cwd;

beforeAll(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), "bookstore-identity-cli-"));
});

afterAll(() => {
  fs.rmSync(cwd, { recursive: true, force: true });
});

function run(args, env = {}) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    env: childEnv({ NODE_ENV: "test", JWT_SECRET, ...env }),
    encoding: "utf8",
    timeout: 15000,
  });
  return { ...result, output: `${result.stdout}${result.stderr}` };
}

const localUri = (dbName) => {
  const uri = `${inject("mongoUri")}${dbName}_${RUN}`;
  assertLocalMongoUri(uri);
  return uri;
};

// A database without the app's indexes, so it can hold duplicates
async function withDatabase(dbName, use) {
  const connection = await mongoose.createConnection(localUri(dbName)).asPromise();
  try {
    return await use(connection.db);
  } finally {
    await connection.close();
  }
}

describe("catalogue identity check CLI", () => {
  it("refuses a remote database before any connection", () => {
    const result = run([], { MONGODB_URI: REMOTE_URI });

    expect(result.status, result.output).toBe(1);
    expect(result.stderr).toContain("non-local MongoDB");
    expect(result.stderr).not.toMatch(/^\s+at /m);
  });

  it("prints the usage and exits 2 for any argument", () => {
    const result = run(["--fix"]);

    expect(result.status, result.output).toBe(2);
    expect(result.stderr).toMatch(/^usage: /m);
  });

  it("exits 0 on a clean database and creates no index or collection", async () => {
    const dbName = "identity_cli_clean";
    await withDatabase(dbName, (db) =>
      db.collection("authors").insertMany([
        { firstName: "Karel", lastName: "Čapek" },
        { firstName: "Karel", lastName: "Capek" },
      ])
    );

    const result = run([], { MONGODB_URI: localUri(dbName) });

    expect(result.status, result.output).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      collation: { locale: "cs", strength: 2 },
      authors: { total: 2, collisions: [] },
      books: { total: 0, collisions: [] },
    });
    const after = await withDatabase(dbName, async (db) => ({
      collections: (await db.listCollections().toArray()).map(({ name }) => name),
      indexes: (await db.collection("authors").indexes()).map(({ name }) => name),
    }));
    expect(after).toEqual({ collections: ["authors"], indexes: ["_id_"] });
  });

  it("exits 1 and lists the authors of a collision", async () => {
    const dbName = "identity_cli_collision";
    const ids = await withDatabase(dbName, async (db) => {
      const { insertedIds } = await db.collection("authors").insertMany([
        { firstName: "Karel", lastName: "Čapek" },
        { firstName: "KAREL", lastName: "čapek" },
      ]);
      return Object.values(insertedIds).map(String);
    });

    const result = run([], { MONGODB_URI: localUri(dbName) });

    expect(result.status, result.output).toBe(1);
    expect(result.stderr).toContain("1 collision");
    expect(JSON.parse(result.stdout).authors.collisions).toEqual([
      {
        authors: [
          { id: ids[0], firstName: "Karel", lastName: "Čapek", books: 0 },
          { id: ids[1], firstName: "KAREL", lastName: "čapek", books: 0 },
        ],
      },
    ]);
  });

  it("exits 1 and lists the books of a collision", async () => {
    const dbName = "identity_cli_book_collision";
    const author = new mongoose.Types.ObjectId();
    const ids = await withDatabase(dbName, async (db) => {
      const { insertedIds } = await db.collection("books").insertMany([
        { title: "R.U.R.", author, publicationYear: 1920 },
        { title: "r.u.r.", author, publicationYear: 1920 },
      ]);
      return Object.values(insertedIds).map(String);
    });

    const result = run([], { MONGODB_URI: localUri(dbName) });

    expect(result.status, result.output).toBe(1);
    expect(result.stderr).toContain("1 collision");
    expect(JSON.parse(result.stdout).books.collisions).toEqual([
      {
        author: String(author),
        publicationYear: 1920,
        books: [
          { id: ids[0], title: "R.U.R." },
          { id: ids[1], title: "r.u.r." },
        ],
      },
    ]);
  });
});
