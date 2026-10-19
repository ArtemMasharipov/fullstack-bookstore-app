import bcrypt from "bcrypt";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import User from "../../models/User.js";
import Order from "../../models/Order.js";
import { issueToken } from "../../services/sessions.js";
import { useTestDatabase } from "../helpers/db.js";
import { createLegacyOrder, createPlacedOrder } from "../helpers/factories.js";
import { ORDER_CASES, ORDER_TARGETS } from "../helpers/order-transition-cases.js";

useTestDatabase();
let hash, owner, adminToken, ownerToken, otherToken;
beforeAll(async () => { hash = await bcrypt.hash("secret123", 10); });
beforeEach(async () => {
  // Real users and persisted sessions; reuse one test hash to keep a full
  // HTTP role/transition matrix from benchmarking password hashing instead.
  const users = await User.insertMany(["admin", "owner", "other"].map((name) => ({
    username: name, email: `${name}@example.com`, password: hash, role: name === "admin" ? "admin" : "user",
  })));
  owner = users[1];
  [adminToken, ownerToken, otherToken] = await Promise.all(users.map((user) => issueToken(user._id)));
});
const send = (id, axis, to, token = adminToken) => {
  const req = request(app).patch(`/api/v1/orders/${id}/${axis}`);
  if (token) req.set("Authorization", `Bearer ${token}`);
  return axis === "cancel" ? req : req.send({ [axis === "payment" ? "paymentStatus" : "status"]: to });
};
async function placed(status, paymentStatus) {
  const order = await createPlacedOrder(owner, { status });
  await Order.collection.updateOne({ _id: order._id }, { $set: { paymentStatus } });
  return order;
}
const matrix = ORDER_CASES.flatMap(([status, payment, allowed]) => ORDER_TARGETS.map(([axis, to]) =>
  [status, payment, axis, to, allowed.some(([a, t]) => a === axis && t === to) ? 200 : 409]));

describe("order transition HTTP matrix", () => {
  it.each(matrix)("%s/%s → %s:%s gives admin %i and denies non-admins", async (status, payment, axis, to, expected) => {
    const order = await placed(status, payment);
    for (const [token, code] of [[null, 401], [ownerToken, 403], [otherToken, 403]]) {
      expect((await send(order._id, axis, to, token)).status).toBe(code);
    }
    const res = await send(order._id, axis, to);
    expect(res.status).toBe(expected);
    const saved = await Order.findById(order._id).lean();
    if (expected === 409) {
      expect(res.body.error.code).toBe("INVALID_TRANSITION");
      expect(saved.status).toBe(status);
      expect(saved.paymentStatus).toBe(payment);
      expect(saved.statusHistory).toHaveLength(1);
    } else {
      expect(res.body.data[axis === "status" ? "status" : "paymentStatus"]).toBe(to);
      const entries = res.body.data.statusHistory.slice(1);
      expect(entries[0]).toMatchObject({ axis, from: axis === "status" ? status : payment, to, by: "admin" });
      if (axis === "payment" && to === "paid") {
        expect(saved.status).toBe("processing");
        expect(entries).toHaveLength(2);
        expect(entries[1]).toMatchObject({ axis: "status", from: "pending", to: "processing", at: entries[0].at });
      }
      if (to === "cancelled") {
        expect(saved.cancelledAt.toISOString()).toBe(entries[0].at);
        if (payment === "paid") {
          expect(saved.paymentStatus).toBe("refunded");
          expect(entries).toHaveLength(2);
          expect(entries[1]).toMatchObject({ axis: "payment", from: "paid", to: "refunded", at: entries[0].at });
        }
      }
    }
  });

  it.each(ORDER_CASES)("user cancellation of %s/%s preserves owner privacy", async (status, payment, _admin, allowed) => {
    const order = await placed(status, payment);
    expect((await send(order._id, "cancel", null, null)).status).toBe(401);
    expect((await send(order._id, "cancel", null, otherToken)).status).toBe(404);
    const res = await send(order._id, "cancel", null, ownerToken);
    expect(res.status).toBe(allowed.length ? 200 : 409);
    if (allowed.length) expect(res.body.data.statusHistory.at(-1)).toMatchObject({ axis: "status", to: "cancelled", by: "user" });
    else expect(res.body.error.code).toBe("INVALID_TRANSITION");
  });

  it("updates a legacy order without recalculating its money", async () => {
    const order = await createLegacyOrder(owner);
    const paid = await send(order._id, "payment", "paid");
    expect(paid.status).toBe(200);
    expect(paid.body.data).toMatchObject({ status: "processing", paymentStatus: "paid", quote: { total: 3858 } });
    expect(paid.body.data.statusHistory.map((entry) => entry.at)).toEqual([expect.any(String), paid.body.data.statusHistory[0].at]);
    const cancelled = await send(order._id, "status", "cancelled");
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.paymentStatus).toBe("refunded");
    expect((await Order.collection.findOne({ _id: order._id })).totalPrice).toBe(38.58);
  });

  it("rejects malformed payment bodies and the removed pay endpoint", async () => {
    const order = await placed("pending", "unpaid");
    for (const data of [{}, { paymentStatus: "failed" }, { paymentStatus: { $ne: "paid" } }, { paymentStatus: "paid", extra: 1 }]) {
      const res = await request(app).patch(`/api/v1/orders/${order._id}/payment`).set("Authorization", `Bearer ${adminToken}`).send(data);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_FAILED");
    }
    expect((await send(order._id, "pay")).status).toBe(404);
    expect((await send("64b7f0c2a1b2c3d4e5f60718", "payment", "paid")).status).toBe(404);
  });

  it("keeps one result and complete history when payment races cancellation", async () => {
    const order = await placed("pending", "unpaid");
    const answers = await Promise.all([send(order._id, "payment", "paid"), send(order._id, "cancel", null, ownerToken)]);
    expect(answers.map((res) => res.status).sort()).toEqual([200, 409]);
    expect(["CONFLICT", "INVALID_TRANSITION"]).toContain(answers.find((res) => res.status === 409).body.error.code);
    const saved = await Order.findById(order._id).lean();
    if (saved.status === "processing") {
      expect(saved.paymentStatus).toBe("paid");
      expect(saved.statusHistory).toHaveLength(3);
    } else {
      expect(saved.status).toBe("cancelled");
      expect(saved.paymentStatus).toBe("unpaid");
      expect(saved.statusHistory).toHaveLength(2);
    }
  });

  it("records one payment when two admins submit the same action", async () => {
    const order = await placed("pending", "unpaid");
    const answers = await Promise.all([send(order._id, "payment", "paid"), send(order._id, "payment", "paid")]);
    expect(answers.map((res) => res.status).sort()).toEqual([200, 409]);
    expect(["CONFLICT", "INVALID_TRANSITION"]).toContain(answers.find((res) => res.status === 409).body.error.code);
    const saved = await Order.findById(order._id).lean();
    expect(saved.statusHistory).toHaveLength(3);
    expect(saved.status).toBe("processing");
    expect(saved.paymentStatus).toBe("paid");
  });
});
