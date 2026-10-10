/**
 * Vitest global setup
 * One in-memory MongoDB for the whole run; every worker uses its own database
 * on it (see helpers/db.js). The URI reaches tests through inject("mongoUri").
 */

import { MongoMemoryServer } from "mongodb-memory-server";

export default async function setup(project) {
  const mongod = await MongoMemoryServer.create();
  project.provide("mongoUri", mongod.getUri());

  return async () => {
    await mongod.stop();
  };
}
