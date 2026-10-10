/**
 * Local MongoDB Guard
 * Tests, e2e and seed must never reach a remote database (for example the one
 * from backend/.env). The barrier is the check of the URI before connecting;
 * the check after connecting is a second layer (see assertLocalConnection).
 * Error messages never include any part of the URI.
 */

export const LOCAL_MONGO_HOSTS = Object.freeze([
  "localhost",
  "127.0.0.1",
  "::1",
]);

// "[::1]:27017", "[::1]" or "localhost:27017", "localhost" (port is digits only)
const HOST_ENTRY = /^(?:\[([^\]]+)\]|([^:[\]]+))(?::\d+)?$/;

const refuse = (reason) =>
  new Error(
    `Refusing to use non-local MongoDB (${reason}). ` +
      `Allowed hosts: ${LOCAL_MONGO_HOSTS.join(", ")}`
  );

const isLocalHost = (host) =>
  typeof host === "string" && LOCAL_MONGO_HOSTS.includes(host.toLowerCase());

export function assertLocalMongoUri(uri) {
  if (typeof uri !== "string" || uri === "") throw refuse("empty URI");

  // Authority = text between "://" and the first "/"
  const match = /^(mongodb(?:\+srv)?):\/\/([^/]*)/i.exec(uri);
  if (!match) throw refuse("unsupported URI");
  if (match[1].toLowerCase() === "mongodb+srv") {
    throw refuse("mongodb+srv is not allowed");
  }

  // Credentials end at the first "@", as in the driver's own parser;
  // every host after it must be local
  const authority = match[2];
  const hostList = authority.slice(authority.indexOf("@") + 1);
  const allLocal = hostList.split(",").every((entry) => {
    const parsed = HOST_ENTRY.exec(entry);
    return parsed !== null && isLocalHost(parsed[1] ?? parsed[2]);
  });
  if (!allLocal) throw refuse("host is not local");
}

// A second layer behind assertLocalMongoUri, not a look at the server:
// mongoose's connection.host is the first host of the URI as the driver parsed
// it, and by the time this runs mongoose may already have created collections
// and indexes (autoCreate, autoIndex)
export function assertLocalConnection(connection) {
  if (!isLocalHost(connection?.host)) {
    throw refuse("connected host is not local");
  }
}
