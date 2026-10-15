import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

// Every error of the API, whoever raises it, has one shape:
// { success: false, error: { code, message, fields?, details? } }
useTestDatabase();

const ANY_ID = "64b7f0c2a1b2c3d4e5f60718";

describe("error envelope", () => {
  it("answers an unknown route with NOT_FOUND", async () => {
    const res = await request(app).get("/api/v1/nowhere");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  });

  it("answers a protected route without a token with UNAUTHORIZED", async () => {
    const res = await request(app).get("/api/v1/cart");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  describe("admin endpoints that check their body by hand", () => {
    let token;

    beforeEach(async () => {
      token = await loginAs(app, await createUser({ role: "admin" }));
    });

    it.each([
      ["/api/v1/books", "stock", { inStock: "yes" }, { inStock: "invalid_type" }],
      ["/api/v1/orders", "status", {}, { status: "required" }],
      ["/api/v1/users", "status", { isActive: "x" }, { isActive: "invalid_type" }],
    ])("%s/:id/%s answers a bad body with VALIDATION_FAILED", async (base, action, body, fields) => {
      const res = await request(app)
        .patch(`${base}/${ANY_ID}/${action}`)
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_FAILED");
      expect(res.body.error.fields).toEqual(fields);
    });
  });
});
