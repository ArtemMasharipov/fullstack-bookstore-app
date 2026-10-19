import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import Order from "../../models/Order.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createLegacyOrder, createPlacedOrder } from "../helpers/factories.js";

useTestDatabase();
let customer, token;
beforeEach(async () => {
  customer = await createUser();
  token = await loginAs(app, await createUser({ role: "admin" }));
});
const stats = () => request(app).get("/api/v1/orders/admin/stats").set("Authorization", `Bearer ${token}`);

describe("order statistics definitions", () => {
  it("counts only paid non-cancelled orders, with legacy flags used only when the new status is absent", async () => {
    const quote = (total) => ({ currency: "CZK", itemsTotal: total, shipping: 0, vatIncluded: true, vatAmount: 0, total });
    await createPlacedOrder(customer, { status: "delivered", paymentStatus: "paid", quote: quote(10000) });
    await createPlacedOrder(customer, { status: "processing", paymentStatus: "paid", quote: quote(23456) });
    await createPlacedOrder(customer, { status: "cancelled", paymentStatus: "paid", quote: quote(50000) });
    const refunded = await createPlacedOrder(customer, { status: "delivered", paymentStatus: "refunded" });
    const unpaid = await createPlacedOrder(customer);
    await Order.collection.updateMany({ _id: { $in: [refunded._id, unpaid._id] } }, { $set: { isPaid: true } });
    await createLegacyOrder(customer, { orderNumber: "legacy-paid", isPaid: true });
    await createLegacyOrder(customer, { orderNumber: "legacy-cancelled", isPaid: true, status: "cancelled" });
    await createLegacyOrder(customer, { orderNumber: "legacy-refunded", isPaid: true, status: "delivered", paymentStatus: "refunded" });
    await createPlacedOrder(customer, { paymentStatus: "failed" });
    expect(await Order.countDocuments()).toBe(9);
    const res = await stats();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: {
      total: 9, byStatus: { pending: 3, processing: 1, delivered: 3, cancelled: 2 },
      paidOrders: 3, pendingOrders: 3, deliveredOrders: 3, totalRevenue: 37314, currency: "CZK",
    } });
  });

  it("returns zero counts and revenue when there are no orders", async () => {
    expect((await stats()).body).toEqual({ success: true, data: {
      total: 0, byStatus: {}, paidOrders: 0, pendingOrders: 0, deliveredOrders: 0, totalRevenue: 0, currency: "CZK",
    } });
  });

  it("rejects unknown stats query parameters", async () => {
    const res = await request(app).get("/api/v1/orders/admin/stats?extra=1").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty(["extra"]);
  });
});
