/**
 * E2E server
 * The API for the Playwright smoke test (npm run e2e:server): an in-memory
 * MongoDB, seeded with the demo data, and the app on E2E_API_PORT (3100 by
 * default). It never reads .env and ignores MONGODB_URI of its environment, so
 * it can not reach the database of a developer's backend/.env.
 *
 * The order matters: the environment is set before the app and the config are
 * imported, because config/default.js reads it when it is imported.
 *
 * mongod keeps its data in a directory of its own in the temp folder
 * (bookstore-e2e-mongo-*), which every stop removes: SIGTERM, SIGINT, or the
 * end of the IPC channel when a test started the server. A killed server
 * cannot remove it (on Windows Playwright kills the process tree), so every
 * start removes such directories once they have not changed for an hour.
 */

import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { assertLocalConnection } from "../config/mongo-guard.js";
import { seed } from "./seed.js";

const DB_PATH_PREFIX = "bookstore-e2e-mongo-";
const STALE_AFTER_MS = 60 * 60 * 1000;
// Playwright kills the server 10 s after its SIGTERM (gracefulShutdown in
// frontend/playwright.config.js); a stop that hangs ends before that
const STOP_DEADLINE_MS = 8000;

// Best effort: a directory that is in use or already gone is skipped, and
// nothing but the directories with the prefix is touched
function removeStaleDbPaths() {
  const tmpDir = os.tmpdir();
  try {
    for (const name of fs.readdirSync(tmpDir)) {
      if (!name.startsWith(DB_PATH_PREFIX)) continue;
      const dir = path.join(tmpDir, name);
      try {
        const stats = fs.lstatSync(dir);
        const stale = Date.now() - stats.mtimeMs > STALE_AFTER_MS;
        if (stats.isDirectory() && stale) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      } catch {
        // Left for a later start
      }
    }
  } catch {
    // The temp folder cannot be read: nothing is removed
  }
}

removeStaleDbPaths();
const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), DB_PATH_PREFIX));
const mongod = await MongoMemoryServer.create({ instance: { dbPath } });
console.log(`mongo dbPath ${dbPath}`);

let server;
let stopping = false;

// Closes what was started, each step on its own, so that a failing step never
// leaves the in-memory mongod running; then exits
async function stop(exitCode) {
  if (stopping) return;
  stopping = true;

  setTimeout(() => {
    console.error("E2E server shutdown timed out");
    process.exit(1);
  }, STOP_DEADLINE_MS).unref();

  const steps = [
    () => server && new Promise((resolve) => server.close(resolve)),
    () => mongoose.disconnect(),
    () => mongod.stop(),
    // Once mongod has exited: Windows does not delete files that are open
    () =>
      fs.promises.rm(dbPath, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      }),
  ];
  for (const step of steps) {
    try {
      await step();
    } catch (error) {
      console.error("E2E server shutdown failed:", error.message);
      exitCode = 1;
    }
  }

  process.exit(exitCode);
}

process.on("SIGTERM", () => stop(0));
process.on("SIGINT", () => stop(0));
// Started with an IPC channel (the backend tests): its end is a stop request,
// which unlike SIGTERM also works on Windows
if (process.send) process.on("disconnect", () => stop(0));

try {
  process.env.MONGODB_URI = mongod.getUri("e2e");
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = randomBytes(32).toString("hex");

  const { default: app } = await import("../app.js");
  const { connectDatabase } = await import("../config/index.js");

  await connectDatabase();
  assertLocalConnection(mongoose.connection);
  console.log(`mongo host ${mongoose.connection.host}`);

  await seed({
    adminPassword: process.env.SEED_ADMIN_PASSWORD,
    userPassword: process.env.SEED_USER_PASSWORD,
  });

  server = await new Promise((resolve, reject) => {
    const listening = app.listen(Number(process.env.E2E_API_PORT ?? 3100));
    listening.once("listening", () => resolve(listening));
    listening.once("error", reject);
  });
  console.log(`E2E API listening on ${server.address().port}`);
} catch (error) {
  console.error("E2E server failed to start:", error.message);
  await stop(1);
}
