/**
 * Seed script
 * seed() fills the database of the open mongoose connection with the demo
 * users, authors and books of seed-data.js. The CLI (npm run seed, optionally
 * with --reset) wraps it with the local-only guard: a database that is not
 * local is refused, unless SEED_ALLOW_REMOTE=true is set in the environment of
 * the run (never read from .env) and --reset is not given.
 *
 * Importing this module has no side effects: it reads no .env and validates no
 * configuration, so a caller such as the e2e server can import seed() and set
 * its own environment afterwards. The CLI runs only when this file is the entry
 * module, and loads .env and the config then.
 */

import { randomBytes } from "node:crypto";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import mongoose from "mongoose";
import {
  assertLocalConnection,
  assertLocalMongoUri,
} from "../config/mongo-guard.js";
import Author from "../models/Author.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import { newPasswordIssue, validateNewPassword } from "../utils/passwordPolicy.js";
import { AUTHORS, BOOKS, SEED_USERS } from "./seed-data.js";

/**
 * Without reset it refuses a database that already has the seed admin; which
 * database may be seeded is up to the caller (the CLI guards it). With reset it
 * first deletes ALL documents of users, authors and books, and refuses a
 * connection that is not local before it deletes anything.
 */
export async function seed({ adminPassword, userPassword, reset = false }) {
  // Check both accounts before any persistence, including a destructive reset.
  adminPassword = validateNewPassword(adminPassword, SEED_USERS.admin);
  userPassword = validateNewPassword(userPassword, SEED_USERS.user);
  const users = [
    new User({ ...SEED_USERS.admin, password: adminPassword, role: "admin" }),
    new User({ ...SEED_USERS.user, password: userPassword, role: "user" }),
  ];
  // Before anything is written or deleted: a bad password must not leave the
  // database half seeded, or emptied by reset
  await Promise.all(users.map((user) => user.validate()));

  if (reset) {
    assertLocalConnection(mongoose.connection);
    await Promise.all([
      User.deleteMany({}),
      Author.deleteMany({}),
      Book.deleteMany({}),
    ]);
  } else if (await User.exists({ email: SEED_USERS.admin.email })) {
    throw new Error("Database already seeded; run with --reset");
  }

  for (const user of users) await user.save();
  const authors = await Author.create(AUTHORS);

  // One by one, so createdAt rises in the listed order: the last book is the
  // newest, which the e2e smoke test relies on
  for (const book of BOOKS) {
    await Book.create({ ...book, author: authors[book.author]._id });
  }

  return {
    users: Object.keys(SEED_USERS).length,
    authors: authors.length,
    books: BOOKS.length,
  };
}

// =============================================================================
// CLI
// =============================================================================

// The script node was started with. import.meta.url is a real path, while
// process.argv[1] may be the path of a link to it: both are compared resolved.
function isEntryModule() {
  try {
    return (
      import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
    );
  } catch {
    // No entry script (node -e, a REPL)
    return false;
  }
}

// SEED_ADMIN_PASSWORD / SEED_USER_PASSWORD. A password that is not set is made
// up when a person runs the CLI in a terminal, and is an error otherwise (CI,
// e2e).
function choosePasswords(env) {
  const passwords = {
    admin: env.SEED_ADMIN_PASSWORD,
    user: env.SEED_USER_PASSWORD,
  };
  const generated = {};

  for (const role of Object.keys(passwords)) {
    if (!passwords[role] && process.stdout.isTTY) {
      do {
        generated[role] = randomBytes(12).toString("base64url");
      } while (newPasswordIssue(generated[role], SEED_USERS[role]));
      passwords[role] = generated[role];
    }
  }
  if (!passwords.admin || !passwords.user) {
    throw new Error("Set SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD");
  }

  return { passwords, generated };
}

async function runCli() {
  // Read before .env is loaded: SEED_ALLOW_REMOTE counts only when it is set
  // for this run. A true kept in backend/.env would let every later run seed
  // the remote database named there.
  const remoteRequested = process.env.SEED_ALLOW_REMOTE === "true";

  try {
    // Imported here and not at the top (see the header). .env goes first: the
    // config reads process.env as soon as it is loaded.
    await import("../config/load-env.js");
    const { resolveMongoUri } = await import("../config/default.js");

    const reset = process.argv.includes("--reset");
    // A remote database only on request, and never to be emptied
    const allowRemote = remoteRequested && !reset;
    const uri = resolveMongoUri(process.env);

    if (!allowRemote) assertLocalMongoUri(uri);
    const { passwords, generated } = choosePasswords(process.env);

    await mongoose.connect(uri);
    if (!allowRemote) assertLocalConnection(mongoose.connection);

    const counts = await seed({
      adminPassword: passwords.admin,
      userPassword: passwords.user,
      reset,
    });
    console.log(
      `Seeded ${counts.users} users, ${counts.authors} authors, ${counts.books} books`
    );
    if (Object.keys(generated).length > 0) {
      console.log("Generated passwords (shown only now):");
      for (const [role, password] of Object.entries(generated)) {
        console.log(`  ${SEED_USERS[role].email}  ${password}`);
      }
    }
  } catch (error) {
    // The message only: no stack, and none of the messages has the URI in it
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    // After a failure too: an open connection would keep the process alive
    await mongoose.disconnect();
  }
}

if (isEntryModule()) await runCli();
