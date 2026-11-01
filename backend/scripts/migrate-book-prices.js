/**
 * Book price migration CLI: npm run migrate:book-prices -- <command>
 *
 *   preflight         lists the books whose price is not whole geller
 *   backup            writes all books to backups/books-<UTC time>.json
 *   up                checks every price, backs the books up, then adds
 *                     priceMinor (whole geller) next to every price
 *   down              removes priceMinor from every book
 *   restore <file>    replaces all books with those of a backup file
 *
 * --backup-dir <dir> writes backups elsewhere. Only a local database is
 * accepted: the URI is checked before connecting and the connection after,
 * as for the seed command. It prints a JSON summary; a refusal exits 1 and a
 * wrong command line 2. See services/bookPriceMigration.js.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { assertLocalConnection, assertLocalMongoUri } from "../config/mongo-guard.js";
import {
  MigrationRefused,
  backup,
  migrateDown,
  migrateUp,
  preflight,
  restore,
} from "../services/bookPriceMigration.js";

const USAGE =
  "usage: npm run migrate:book-prices -- preflight | backup | up | down | restore <file> [--backup-dir <dir>]";
const DEFAULT_BACKUP_DIR = fileURLToPath(new URL("../backups/", import.meta.url));
const COMMANDS = ["preflight", "backup", "up", "down"];

// The command, its file and the backup directory, or null for a wrong line
function parse(argv) {
  const args = [...argv];
  let backupDir = DEFAULT_BACKUP_DIR;
  const flag = args.indexOf("--backup-dir");
  if (flag !== -1) {
    if (!args[flag + 1]) return null;
    backupDir = path.resolve(args[flag + 1]);
    args.splice(flag, 2);
  }

  const [command, file, ...rest] = args;
  if (rest.length > 0) return null;
  if (command === "restore") return file ? { command, file: path.resolve(file), backupDir } : null;
  return COMMANDS.includes(command) && file === undefined ? { command, backupDir } : null;
}

async function run({ command, file, backupDir }) {
  switch (command) {
    case "preflight":
      return preflight();
    case "backup":
      return backup(backupDir);
    case "up": {
      // Checked first, so a refused migration leaves no backup behind
      const { unsupported } = await preflight();
      if (unsupported.length > 0) {
        throw new MigrationRefused("Some book prices are not whole geller", { unsupported });
      }
      const saved = await backup(backupDir);
      return { backup: saved, ...(await migrateUp()) };
    }
    case "down":
      return migrateDown();
    case "restore":
      return restore(file);
    default:
      throw new Error(`Unknown command ${command}`);
  }
}

const options = parse(process.argv.slice(2));
if (!options) {
  console.error(USAGE);
  process.exitCode = 2;
} else {
  try {
    // .env goes first: the config reads process.env as soon as it is loaded
    await import("../config/load-env.js");
    const { resolveMongoUri } = await import("../config/default.js");
    const uri = resolveMongoUri(process.env);

    assertLocalMongoUri(uri);
    await mongoose.connect(uri);
    assertLocalConnection(mongoose.connection);

    console.log(JSON.stringify({ command: options.command, ...(await run(options)) }, null, 2));
  } catch (error) {
    // The message only, no stack, and never the URI; a refusal names the books
    console.error(error.message);
    if (error instanceof MigrationRefused) console.error(JSON.stringify(error.details, null, 2));
    process.exitCode = 1;
  } finally {
    // After a failure too: an open connection would keep the process alive
    await mongoose.disconnect();
  }
}
