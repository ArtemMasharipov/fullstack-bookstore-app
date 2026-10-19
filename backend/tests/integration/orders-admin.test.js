import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createLegacyOrder, createPlacedOrder } from "../helpers/factories.js";

useTestDatabase();

const CONTRACT_KEYS = [
  "createdAt",
  "customer",
  "id",
  "items",
  "orderNumber",
  "paymentStatus",
  "quote",
  "shippingAddress",
  "status",
  "statusHistory",
].sort();

let customer;
let adminToken;

beforeEach(async () => {
  customer = await createUser();
  adminToken = await loginAs(app, await createUser({ role: "admin" }));
});

const asAdmin = (req, token = adminToken) => req.set("Authorization", `Bearer ${token}`);
const listAll = (query = "", token) => asAdmin(request(app).get(`/api/v1/orders/admin/all${query}`), token);
const stats = (token) => asAdmin(request(app).get("/api/v1/orders/admin/stats"), token);
const setStatus = (id, status, token) =>
  asAdmin(request(app).patch(`/api/v1/orders/${id}/status`), token).send({ status });
const pay = (id, token) => asAdmin(request(app).patch(`/api/v1/orders/${id}/payment`), token).send({ paymentStatus: "paid" });

const lastEntries = (order, count) => order.statusHistory.slice(-count);

describe("GET /api/v1/orders/admin/all", () => {
  it("combines refunded and status filters", async () => {
    const delivered = await createPlacedOrder(customer, { status: "delivered", paymentStatus: "refunded" });
    await createPlacedOrder(customer, { status: "cancelled", paymentStatus: "refunded" });
    await createPlacedOrder(customer, { status: "delivered", paymentStatus: "paid" });
    const res = await listAll("?status=delivered&paymentStatus=refunded");
    expect(res.status).toBe(200);
    expect(res.body.data.map((row) => row.id)).toEqual([String(delivered._id)]);
    expect(res.body.pagination.total).toBe(1);
  });

  it.each(["createdAt", "-createdAt"])("sorts equal dates by id across pages with %s", async (sortBy) => {
    const at = new Date("2026-10-01T00:00:00Z");
    const orders = [];
    for (let index = 0; index < 21; index++) orders.push(await createPlacedOrder(customer, { createdAt: at }));
    const ids = orders.map((order) => String(order._id)).sort();
    if (sortBy.startsWith("-")) ids.reverse();
    const pages = await Promise.all([1, 2, 3].map((page) => listAll(`?page=${page}&limit=10&sortBy=${sortBy}`)));
    for (const page of pages) expect(page.status).toBe(200);
    expect(pages.flatMap((page) => page.body.data.map((order) => order.id))).toEqual(ids);
    expect(pages[1].body.pagination).toEqual({ page: 2, limit: 10, total: 21, pages: 3 });
    expect((await listAll("?sortBy=paymentStatus")).status).toBe(400);
  });
  it("lists all orders by the contract with the customer", async () => {
    const current = await createPlacedOrder(customer, { createdAt: new Date("2026-10-02T10:00:00Z") });
    const older = await createLegacyOrder(customer);

    const res = await listAll();

    expect(res.status).toBe(200);
    expect(res.body.data.map((order) => order.id)).toEqual([
      current._id.toString(),
      older._id.toString(),
    ]);
    for (const order of res.body.data) {
      expect(Object.keys(order).sort()).toEqual(CONTRACT_KEYS);
      expect(order.customer).toEqual({
        id: customer._id.toString(),
        email: customer.email,
        username: customer.username,
      });
    }
    expect(res.body.data[1].quote.total).toBe(3858);
    expect(res.body.pagination).toEqual({ page: 1, limit: 20, total: 2, pages: 1 });
  });

  it("filters by payment status for both shapes", async () => {
    const unpaidCurrent = await createPlacedOrder(customer);
    await createPlacedOrder(customer, { paymentStatus: "paid" });
    const unpaidOlder = await createLegacyOrder(customer);
    await createLegacyOrder(customer, { isPaid: true, orderNumber: "ORD-20250101-0002" });

    const res = await listAll("?paymentStatus=unpaid");

    expect(res.body.data.map((order) => order.id).sort()).toEqual(
      [unpaidCurrent._id.toString(), unpaidOlder._id.toString()].sort()
    );
  });

  it("rejects an unknown filter value", async () => {
    const res = await listAll("?status=lost");

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty(["status"]);
  });
});

describe("admin order details", () => {
  it("opens another customer's order with only customer identity and allowed actions", async () => {
    const order = await createPlacedOrder(customer);
    const res = await asAdmin(request(app).get(`/api/v1/orders/${order._id}`));
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data).sort()).toEqual([...CONTRACT_KEYS, "allowedTransitions"].sort());
    expect(res.body.data.customer).toEqual({ id: String(customer._id), username: customer.username, email: customer.email });
    expect(res.body.data.allowedTransitions).toEqual([{ axis: "status", to: "cancelled" }, { axis: "payment", to: "paid" }]);
    expect((await asAdmin(request(app).get(`/api/v1/orders/${order._id}?extra=1`))).status).toBe(400);
  });

  it("opens an order whose customer no longer exists", async () => {
    const order = await createPlacedOrder(customer, { status: "delivered", paymentStatus: "paid" });
    await User.deleteOne({ _id: customer._id });
    const res = await asAdmin(request(app).get(`/api/v1/orders/${order._id}`));
    expect(res.status).toBe(200);
    expect(res.body.data.customer).toBeNull();
    expect(res.body.data.allowedTransitions).toEqual([{ axis: "payment", to: "refunded" }]);
    expect((await Order.findById(order._id)).user.toString()).toBe(String(customer._id));
  });
});

describe("GET /api/v1/orders/admin/stats", () => {
  it("stats count revenue in geller for both shapes", async () => {
    await createPlacedOrder(customer, {
      paymentStatus: "paid",
      status: "delivered",
      quote: { currency: "CZK", itemsTotal: 34900, shipping: 0, vatIncluded: true, vatAmount: 0, total: 34900 },
    });
    await createLegacyOrder(customer, { isPaid: true });
    await createPlacedOrder(customer);

    const res = await stats();

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      total: 3,
      byStatus: { pending: 2, delivered: 1 },
      paidOrders: 2,
      pendingOrders: 2,
      deliveredOrders: 1,
      totalRevenue: 38758,
      currency: "CZK",
    });
  });
});

describe("PATCH /api/v1/orders/:id/status", () => {
  it("status changes are recorded", async () => {
    const order = await createPlacedOrder(customer, { status: "processing", paymentStatus: "paid" });

    const res = await setStatus(order._id.toString(), "shipped");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("shipped");
    expect(lastEntries(res.body.data, 1)).toEqual([
      { axis: "status", from: "processing", to: "shipped", by: "admin", at: expect.any(String) },
    ]);
  });

  it("a cancelled order keeps its status, and the same status again is refused", async () => {
    const cancelled = await createPlacedOrder(customer, { status: "cancelled" });
    const pending = await createPlacedOrder(customer);

    const reopened = await setStatus(cancelled._id.toString(), "processing");
    const unchanged = await setStatus(pending._id.toString(), "pending");

    for (const res of [reopened, unchanged]) {
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("INVALID_TRANSITION");
    }
  });

  it("a missing order is NOT_FOUND", async () => {
    const res = await setStatus("64b7f0c2a1b2c3d4e5f60718", "shipped");

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/v1/orders/:id/payment", () => {
  it("paying records the payment and moves a pending order on", async () => {
    const order = await createPlacedOrder(customer);

    const res = await pay(order._id.toString());
    const again = await pay(order._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ paymentStatus: "paid", status: "processing" });
    expect(lastEntries(res.body.data, 2)).toEqual([
      { axis: "payment", from: "unpaid", to: "paid", by: "admin", at: expect.any(String) },
      { axis: "status", from: "pending", to: "processing", by: "admin", at: expect.any(String) },
    ]);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("INVALID_TRANSITION");
  });

  it("paying an older order works through the adapter", async () => {
    const older = await createLegacyOrder(customer);

    const res = await pay(older._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ paymentStatus: "paid", status: "processing" });
  });
});

describe("admin order endpoints", () => {
  it("a regular user gets FORBIDDEN on admin endpoints", async () => {
    const userToken = await loginAs(app, customer);
    const order = await createPlacedOrder(customer);

    const responses = await Promise.all([
      listAll("", userToken),
      stats(userToken),
      setStatus(order._id.toString(), "shipped", userToken),
      pay(order._id.toString(), userToken),
    ]);

    for (const res of responses) {
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    }
  });
});
