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

// The book price migration CLI (npm run migrate:book-prices) runs in a child
// process, like the seed CLI
const cliPath = fileURLToPath(new URL("../../scripts/migrate-book-prices.js", import.meta.url));

// The CLI imports config/default.js, which needs a JWT_SECRET; childEnv drops
// the one of this machine
const JWT_SECRET = "price-cli-test-secret-0123456789abcdef0123456789";
const REMOTE_URI = "mongodb://db.example.com/shop";

// Database names get a suffix of their own per run (see seed-cli.test.js)
const RUN = randomUUID().slice(0, 8);

// A working directory without a .env, so nothing but the given environment
// reaches the process
let cwd;

beforeAll(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), "bookstore-price-cli-"));
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

async function withBooks(dbName, use) {
  const connection = await mongoose.createConnection(localUri(dbName)).asPromise();
  try {
    return await use(connection.collection("books"));
  } finally {
    await connection.close();
  }
}

describe("book price migration CLI", () => {
  it("refuses a remote database before any connection", () => {
    const result = run(["preflight"], { MONGODB_URI: REMOTE_URI });

    expect(result.status, result.output).toBe(1);
    expect(result.stderr).toContain("non-local MongoDB");
    expect(result.stderr).not.toMatch(/^\s+at /m);
  });

  it("prints the usage and exits 2 for an unknown command", () => {
    const result = run(["sideways"]);

    expect(result.status, result.output).toBe(2);
    expect(result.stderr).toMatch(/^usage: /m);
  });

  it("backs the books up before up, and down removes what up added", async () => {
    const dbName = "price_cli";
    await withBooks(dbName, (books) =>
      books.insertMany([
        { title: "R.U.R.", price: 249.9 },
        { title: "Krakatit", price: 199 },
      ])
    );
    const backups = path.join(cwd, "backups");
    const env = { MONGODB_URI: localUri(dbName) };

    const up = run(["up", "--backup-dir", backups], env);

    expect(up.status, up.output).toBe(0);
    const summary = JSON.parse(up.stdout);
    expect(summary).toMatchObject({ command: "up", updated: 2, skipped: [] });
    expect(summary.backup.count).toBe(2);
    expect(path.dirname(summary.backup.file)).toBe(backups);
    expect(fs.existsSync(summary.backup.file)).toBe(true);
    const minor = await withBooks(dbName, (books) =>
      books.find({}, { projection: { _id: 0, priceMinor: 1 } }).sort({ priceMinor: 1 }).toArray()
    );
    expect(minor).toEqual([{ priceMinor: 19900 }, { priceMinor: 24990 }]);

    const down = run(["down"], env);

    expect(down.status, down.output).toBe(0);
    expect(JSON.parse(down.stdout)).toMatchObject({ command: "down", reverted: 2 });
  });

  it("refuses up for a price that is not whole geller, and writes nothing", async () => {
    const dbName = "price_cli_odd";
    await withBooks(dbName, (books) => books.insertOne({ title: "Odd", price: 199.999 }));
    const backups = path.join(cwd, "odd-backups");

    const result = run(["up", "--backup-dir", backups], { MONGODB_URI: localUri(dbName) });

    expect(result.status, result.output).toBe(1);
    expect(result.stderr).toContain("not whole geller");
    expect(await withBooks(dbName, (books) => books.findOne({}))).not.toHaveProperty("priceMinor");
    expect(fs.existsSync(backups)).toBe(false);
  });
});
