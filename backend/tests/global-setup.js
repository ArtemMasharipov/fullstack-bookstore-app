/**
 * Vitest global setup
 * One in-memory MongoDB for the whole run; every worker uses its own database
 * on it (see helpers/db.js). The URI reaches tests through inject("mongoUri").
 *
 * It is a single-node replica set, because MongoDB runs multi-document
 * transactions only on a replica set. The URI is the member's plain address,
 * without ?replicaSet=, so tests can append a database name to it; the driver
 * learns about the set from the server.
 */

import { MongoMemoryReplSet } from "mongodb-memory-server";

export default async function setup(project) {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  project.provide("mongoUri", replSet.servers[0].getUri());

  return async () => {
    await replSet.stop();
  };
}
