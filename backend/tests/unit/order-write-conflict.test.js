import { describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ written: false }));
vi.mock("../../models/Order.js", () => ({ default: {
  findById: () => ({ lean: async () => ({ _id: "order", status: "pending", paymentStatus: "unpaid" }) }),
  findOneAndUpdate: (filter) => ({ lean: async () => {
    // A payment has completed after the read while the order is still pending.
    if (filter.paymentStatus !== "unpaid" || filter.status !== "pending") state.written = true;
    return null;
  } }),
} }));
import { setOrderStatus } from "../../services/orderService.js";

describe("order conditional writes", () => {
  it("refuses a stale snapshot of either axis with CONFLICT", async () => {
    state.written = false;
    await expect(setOrderStatus("order", "cancelled")).rejects.toMatchObject({ code: "CONFLICT", statusCode: 409 });
    expect(state.written).toBe(false);
  });
});
