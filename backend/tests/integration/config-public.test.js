import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";

describe("GET /api/v1/config/public", () => {
  it("answers the shop settings without a token", async () => {
    const res = await request(app).get("/api/v1/config/public");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        currency: "CZK",
        vatIncluded: true,
        vatRatePercent: 0,
        shippingFee: 9900,
        freeShippingThreshold: 100000,
        paymentMethods: [],
      },
    });
  });
});
