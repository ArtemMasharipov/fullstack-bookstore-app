/**
 * Test database helper
 * Call useTestDatabase() at the top of an integration test file. The file gets
 * its own database (test_<VITEST_POOL_ID>) on the in-memory server, so test
 * files running in parallel workers never share data.
 */

import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, inject } from "vitest";
import { ensureIndexes } from "../../config/database.js";
import {
  assertLocalConnection,
  assertLocalMongoUri,
} from "../../config/mongo-guard.js";
import { resetAuthRateLimit } from "../../middleware/rateLimit.js";

async function clearCollections() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export function useTestDatabase() {
  beforeAll(async () => {
    const uri = inject("mongoUri");
    assertLocalMongoUri(uri);

    await mongoose.connect(uri, {
      dbName: `test_${process.env.VITEST_POOL_ID ?? "0"}`,
    });
    // A second layer behind the URI check above (see mongo-guard.js). If it
    // throws, afterAll still closes the connection; no test has written yet,
    // but mongoose may already have created collections and indexes
    assertLocalConnection(mongoose.connection);

    await clearCollections();
    // As the server does on start: no test runs before the unique indexes exist
    await ensureIndexes();
  });

  // The failed sign-in counts too: every test starts below the limit
  afterEach(async () => {
    await clearCollections();
    await resetAuthRateLimit();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
}
