/** The status and payment actions offered and accepted by the admin API. */
import { ConflictError } from "../utils/errors.js";
import { paymentStatusOf } from "./orderView.js";

const RULES = Object.freeze([
  { axis: "status", from: "pending", to: "processing", by: "admin", payments: ["paid"] },
  { axis: "status", from: "pending", to: "cancelled", by: "user", payments: ["unpaid", "failed"] },
  { axis: "status", from: "pending", to: "cancelled", by: "admin" },
  { axis: "status", from: "processing", to: "shipped", by: "admin" },
  { axis: "status", from: "processing", to: "cancelled", by: "admin" },
  { axis: "status", from: "shipped", to: "delivered", by: "admin" },
  { axis: "payment", from: "unpaid", to: "paid", by: "admin", statuses: ["pending"] },
  { axis: "payment", from: "paid", to: "refunded", by: "admin", statuses: ["delivered"] },
]);

function rulesFor(order, by) {
  const payment = paymentStatusOf(order);
  if (payment === "refunded") return [];
  return RULES.filter((rule) => rule.by === by &&
    rule.from === (rule.axis === "status" ? order.status : payment) &&
    (!rule.payments || rule.payments.includes(payment)) &&
    (!rule.statuses || rule.statuses.includes(order.status)));
}

export function allowedOrderTransitions(order, actorRole) {
  return rulesFor(order, actorRole).map(({ axis, to }) => ({ axis, to }));
}

/** Plans one atomic write; every history entry uses the operation's one time. */
export function planOrderTransition(order, { axis, to, by, at }) {
  const rule = rulesFor(order, by).find((item) => item.axis === axis && item.to === to);
  if (!rule) throw new ConflictError("This order transition is not allowed", "INVALID_TRANSITION");
  const set = { [axis === "status" ? "status" : "paymentStatus"]: to };
  const history = [{ axis, from: rule.from, to, by, at }];
  if (axis === "status" && to === "cancelled") {
    set.cancelledAt = at;
    if (paymentStatusOf(order) === "paid") {
      set.paymentStatus = "refunded";
      history.push({ axis: "payment", from: "paid", to: "refunded", by, at });
    }
  }
  if (axis === "payment" && to === "paid") {
    set.status = "processing";
    history.push({ axis: "status", from: "pending", to: "processing", by, at });
  }
  return { set, history };
}
