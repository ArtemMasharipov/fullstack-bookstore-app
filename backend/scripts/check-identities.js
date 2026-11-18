/**
 * Catalogue identity check: npm run check:identities
 *
 * Lists the authors whose names, and the books of one author and year whose
 * titles, are one under the collation of their unique indexes (see
 * services/catalogueIdentities.js). Run it before starting a release that
 * builds those indexes: the server does not start while such duplicates exist. It reads only, and never merges or deletes anything; each
 * collision is settled by hand, through the API.
 *
 * Only a local database is accepted: the URI is checked before connecting and
 * the connection after, as for the seed command. It prints a JSON report and
 * exits 0 without collisions, 1 with collisions or on an error, and 2 for a
 * wrong command line.
 */

import mongoose from "mongoose";
import { assertLocalConnection, assertLocalMongoUri } from "../config/mongo-guard.js";
import { findIdentityCollisions } from "../services/catalogueIdentities.js";

const USAGE = "usage: npm run check:identities";

if (process.argv.length > 2) {
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

    const report = await findIdentityCollisions();
    console.log(JSON.stringify(report, null, 2));
    const collisions = report.authors.collisions.length + report.books.collisions.length;
    if (collisions > 0) {
      console.error(`${collisions} collision(s) keep a unique index from being built; settle each one first`);
      process.exitCode = 1;
    }
  } catch (error) {
    // The message only, no stack, and never the URI
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    // After a failure too: an open connection would keep the process alive
    await mongoose.disconnect();
  }
}
