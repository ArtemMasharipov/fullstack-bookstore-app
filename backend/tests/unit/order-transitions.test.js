import { describe, expect, it } from "vitest";
import { allowedOrderTransitions, planOrderTransition } from "../../services/orderTransitions.js";
import { ORDER_CASES, ORDER_TARGETS } from "../helpers/order-transition-cases.js";

const at = new Date("2026-10-19T12:00:00Z");
describe("order transition rules", () => {
  it.each(ORDER_CASES)("offers exactly the actions allowed for %s/%s", (status, paymentStatus, admin, user) => {
    for (const [by, actions] of [["admin", admin], ["user", user], ["guest", []]]) {
      const order = { status, paymentStatus };
      const expected = actions.map(([axis, to]) => ({ axis, to }));
      expect(allowedOrderTransitions(order, by)).toEqual(expected);
      for (const [axis, to] of ORDER_TARGETS) {
        const action = () => planOrderTransition(order, { axis, to, by, at });
        if (actions.some(([a, t]) => a === axis && t === to)) {
          const result = action();
          expect(result.set[axis === "status" ? "status" : "paymentStatus"]).toBe(to);
          expect(result.history[0]).toEqual({ axis, from: axis === "status" ? status : paymentStatus, to, by, at });
        } else expect(action).toThrow(expect.objectContaining({ code: "INVALID_TRANSITION", statusCode: 409 }));
      }
    }
  });

  it("uses one timestamp for payment and processing", () => {
    expect(planOrderTransition({ status: "pending", paymentStatus: "unpaid" }, { axis: "payment", to: "paid", by: "admin", at }))
      .toEqual({ set: { paymentStatus: "paid", status: "processing" }, history: [
        { axis: "payment", from: "unpaid", to: "paid", by: "admin", at },
        { axis: "status", from: "pending", to: "processing", by: "admin", at },
      ] });
  });

  it("uses one timestamp for cancellation, refund and cancelledAt", () => {
    expect(planOrderTransition({ status: "processing", paymentStatus: "paid" }, { axis: "status", to: "cancelled", by: "admin", at }))
      .toEqual({ set: { status: "cancelled", paymentStatus: "refunded", cancelledAt: at }, history: [
        { axis: "status", from: "processing", to: "cancelled", by: "admin", at },
        { axis: "payment", from: "paid", to: "refunded", by: "admin", at },
      ] });
  });

  it("adapts missing paymentStatus without modifying the stored object", () => {
    const order = { status: "pending", isPaid: true };
    expect(allowedOrderTransitions(order, "admin")).toEqual([{ axis: "status", to: "processing" }, { axis: "status", to: "cancelled" }]);
    expect(order).toEqual({ status: "pending", isPaid: true });
  });
});
