import { expect, it } from "vitest";
import { ensureIndexes } from "../../config/database.js";
import Order from "../../models/Order.js";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();

// Mongoose builds indexes in the background, one after another, and does not
// wait for them before queries run. An order is placed once per key only
// because of a unique index, so the app must not take requests before it exists.
it("builds every declared index, whatever the background build has done", async () => {
  await Order.init();
  await Order.collection.dropIndexes();

  await ensureIndexes();

  const indexes = await Order.collection.indexes();
  expect(indexes.find((index) => index.name === "user_1_idempotencyKey_1")).toMatchObject({
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  });
  expect(indexes.map((index) => index.name)).toContain("orderNumber_1");
});
