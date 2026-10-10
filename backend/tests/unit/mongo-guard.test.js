import { describe, expect, it } from "vitest";
import { assertLocalConnection, assertLocalMongoUri } from "../../config/mongo-guard.js";

describe("assertLocalMongoUri", () => {
  it.each([
    "mongodb://127.0.0.1:27017/x",
    "mongodb://localhost/x",
    "mongodb://[::1]:27017/x",
    "mongodb://user:p%40ss@localhost:27017/x?authSource=admin",
  ])("accepts %s", (uri) => expect(() => assertLocalMongoUri(uri)).not.toThrow());

  it.each([
    "mongodb+srv://cluster0.example.mongodb.net/x",
    "mongodb://db.example.com:27017/x",
    "mongodb://127.0.0.1:27017,db.example.com:27017/x?replicaSet=rs0",
    "",
    undefined,
  ])("rejects %s", (uri) => expect(() => assertLocalMongoUri(uri)).toThrow(/non-local MongoDB/));
});

describe("assertLocalConnection", () => {
  it("accepts 127.0.0.1", () => expect(() => assertLocalConnection({ host: "127.0.0.1" })).not.toThrow());
  it("rejects a remote host", () => expect(() => assertLocalConnection({ host: "db.example.com" })).toThrow(/non-local MongoDB/));
});

// The driver ends credentials at the FIRST "@" and the host list at "/", "?" or "@",
// so these URIs connect to the remote host although a local host follows the last "@".
describe("assertLocalMongoUri credentials end at the first @", () => {
  it.each([
    "mongodb://u:p@remote.example.com?authSource=admin@localhost",
    "mongodb://localhost@remote.example.com?appName=x@127.0.0.1",
    "mongodb://u:p@ss@localhost/x",
  ])("rejects %s", (uri) => expect(() => assertLocalMongoUri(uri)).toThrow(/non-local MongoDB/));

  it("accepts an upper-case scheme and host", () => expect(() => assertLocalMongoUri("MONGODB://LOCALHOST/x")).not.toThrow());
});

describe("guard error messages", () => {
  const messageOf = (fn) => {
    try {
      fn();
    } catch (error) {
      return error.message;
    }
    return undefined;
  };

  it("keep the host and credentials out of the text", () => {
    const messages = [
      messageOf(() => assertLocalMongoUri("mongodb://secretuser:secretpass@db.example.com/x")),
      messageOf(() => assertLocalConnection({ host: "db.example.com" })),
    ];
    for (const message of messages) {
      expect(message).toMatch(/non-local MongoDB/);
      for (const secret of ["secretuser", "secretpass", "db.example.com"]) {
        expect(message).not.toContain(secret);
      }
    }
  });
});
