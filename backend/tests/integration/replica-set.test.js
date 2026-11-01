import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();

// Registered on the connection, so the helper empties them after every test
const first = mongoose.connection.collection("rs_probe_first");
const second = mongoose.connection.collection("rs_probe_second");

// MongoDB runs multi-document transactions only on a replica set, which is why
// the test database is one (see tests/global-setup.js)
describe("the test database", () => {
  it("is a replica set member", async () => {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });

    expect(hello.setName).toEqual(expect.any(String));
  });

  it("commits writes to both collections together", async () => {
    await mongoose.connection.transaction(async (session) => {
      await first.insertOne({ n: 1 }, { session });
      await second.insertOne({ n: 1 }, { session });
    });

    expect(await first.countDocuments()).toBe(1);
    expect(await second.countDocuments()).toBe(1);
  });

  it("rolls back writes to both collections when the transaction fails", async () => {
    await expect(
      mongoose.connection.transaction(async (session) => {
        await first.insertOne({ n: 1 }, { session });
        await second.insertOne({ n: 1 }, { session });
        throw new Error("abort probe");
      })
    ).rejects.toThrow("abort probe");

    expect(await first.countDocuments()).toBe(0);
    expect(await second.countDocuments()).toBe(0);
  });
});
