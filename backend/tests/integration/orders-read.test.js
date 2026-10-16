import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import Order from "../../models/Order.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createLegacyOrder, createPlacedOrder } from "../helpers/factories.js";

useTestDatabase();

const MISSING_ID = "64b7f0c2a1b2c3d4e5f60718";

const CONTRACT_KEYS = [
  "createdAt",
  "id",
  "items",
  "orderNumber",
  "paymentStatus",
  "quote",
  "shippingAddress",
  "status",
  "statusHistory",
].sort();

let user;
let token;

beforeEach(async () => {
  user = await createUser();
  token = await loginAs(app, user);
});

const as = (req) => req.set("Authorization", `Bearer ${token}`);
const list = (query = "") => as(request(app).get(`/api/v1/orders${query}`));
const show = (id) => as(request(app).get(`/api/v1/orders/${id}`));
const cancel = (id) => as(request(app).patch(`/api/v1/orders/${id}/cancel`));

describe("GET /api/v1/orders", () => {
  it("lists own orders newest first with pagination", async () => {
    const oldest = await createPlacedOrder(user, { createdAt: new Date("2026-10-01T10:00:00Z") });
    await createPlacedOrder(user, { createdAt: new Date("2026-10-02T10:00:00Z") });
    await createPlacedOrder(user, { createdAt: new Date("2026-10-03T10:00:00Z") });
    await createPlacedOrder(await createUser());

    const res = await list("?page=2&limit=2");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      {
        id: oldest._id.toString(),
        orderNumber: oldest.orderNumber,
        createdAt: "2026-10-01T10:00:00.000Z",
        status: "pending",
        paymentStatus: "unpaid",
        total: 29800,
        currency: "CZK",
        itemCount: 1,
      },
    ]);
    expect(res.body.pagination).toEqual({ page: 2, limit: 2, total: 3, pages: 2 });
  });

  it("uses page 1 and ten orders by default", async () => {
    await createPlacedOrder(user);

    const res = await list();

    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toEqual({ page: 1, limit: 10, total: 1, pages: 1 });
  });

  it.each([
    ["page=0", "page"],
    ["limit=51", "limit"],
    ["limit=abc", "limit"],
    ["page[$gt]=1", "page"],
    ["page=1&page=2", "page"],
    [Array(25).fill("page=1").join("&"), "page"],
    ["status=pending", "status"],
  ])("rejects bad paging: %s", async (query, field) => {
    const res = await list(`?${query}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(res.body.error.fields).toHaveProperty([field]);
  });
});

describe("GET /api/v1/orders/:id", () => {
  it("shows an own order by the contract", async () => {
    const order = await createPlacedOrder(user);

    const res = await show(order._id.toString());

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data).sort()).toEqual(CONTRACT_KEYS);
    expect(res.body.data).toMatchObject({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      quote: { total: 29800, vatIncluded: true },
    });
  });

  it("hides another user's order and a missing one as NOT_FOUND", async () => {
    const theirs = await createPlacedOrder(await createUser());

    const foreign = await show(theirs._id.toString());
    const missing = await show(MISSING_ID);

    for (const res of [foreign, missing]) {
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    }
  });

  it("rejects a malformed id", async () => {
    const res = await show("not-an-id");

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty(["id"]);
  });

  it("an older order is read by the contract and stays unchanged", async () => {
    const stored = await createLegacyOrder(user);

    const listed = await list();
    const shown = await show(stored._id.toString());

    expect(listed.body.data).toEqual([
      expect.objectContaining({ id: stored._id.toString(), total: 3858, currency: "CZK", itemCount: 2 }),
    ]);
    expect(Object.keys(shown.body.data).sort()).toEqual(CONTRACT_KEYS);
    expect(shown.body.data.quote).toEqual({
      currency: "CZK",
      itemsTotal: 2598,
      shipping: 1000,
      vatIncluded: false,
      vatAmount: 260,
      total: 3858,
    });
    expect(shown.body.data.items[0]).toMatchObject({ unitPrice: 1299, lineTotal: 2598 });
    expect(shown.body.data.shippingAddress.line1).toBe("Vodičkova 12");
    expect(shown.body.data).not.toHaveProperty("paymentMethod");
    expect(await Order.collection.findOne({ _id: stored._id })).toEqual(stored);
  });
});

describe("PATCH /api/v1/orders/:id/cancel", () => {
  const current = (status, paymentStatus) => () => createPlacedOrder(user, { status, paymentStatus });
  const older = (isPaid) => () => createLegacyOrder(user, { isPaid });

  it.each([
    ["a pending unpaid order", 200, current("pending", "unpaid")],
    ["a pending order whose payment failed", 200, current("pending", "failed")],
    ["a pending paid order", 409, current("pending", "paid")],
    ["a processing order", 409, current("processing", "unpaid")],
    ["a cancelled order", 409, current("cancelled", "unpaid")],
    ["an older unpaid pending order", 200, older(false)],
    ["an older paid pending order", 409, older(true)],
  ])("%s → %i", async (_, expected, create) => {
    const order = await create();

    const res = await cancel(order._id.toString());

    expect(res.status).toBe(expected);
    if (expected === 200) {
      expect(res.body.data.status).toBe("cancelled");
      expect(res.body.data.statusHistory.at(-1)).toEqual({
        axis: "status",
        from: "pending",
        to: "cancelled",
        by: "user",
        at: expect.any(String),
      });
    } else {
      expect(res.body.error.code).toBe("INVALID_TRANSITION");
    }
  });

  it("cancelling another user's order is NOT_FOUND and changes nothing", async () => {
    const theirs = await createPlacedOrder(await createUser());

    const res = await cancel(theirs._id.toString());

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect((await Order.findById(theirs._id).lean()).status).toBe("pending");
  });
});
