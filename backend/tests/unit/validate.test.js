import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createErrorHandler } from "../../middleware/errorHandler.js";
import { validate } from "../../middleware/validate.js";
import { objectId, quantity } from "../../schemas/common.js";

const BOOK_ID = "64b7f0c2a1b2c3d4e5f60718";

const body = z.strictObject({ bookId: objectId, quantity: quantity.default(1) });
const params = z.strictObject({ id: objectId });

// A mini app: the route answers with what validate() put on req.valid
function appWithRoute() {
  const app = express();
  app.use(express.json());
  app.post("/items/:id", validate({ params, body }), (req, res) =>
    res.json(req.valid)
  );
  app.use(createErrorHandler({ log: { error: vi.fn(), warn: vi.fn() } }));
  return app;
}

const post = (payload, id = BOOK_ID) =>
  request(appWithRoute()).post(`/items/${id}`).send(payload);

describe("validate", () => {
  it("rejects an object in place of a string with 400 and the field", async () => {
    const res = await post({ bookId: { $ne: null } });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(res.body.error.fields.bookId).toBe("invalid_type");
  });

  it.each([["5"], [1.5], [0], [100], [-1], [null]])(
    "rejects quantity %j",
    async (value) => {
      const res = await post({ bookId: BOOK_ID, quantity: value });

      expect(res.status).toBe(400);
      expect(res.body.error.fields).toHaveProperty("quantity");
    }
  );

  it("rejects an unknown key of a strict schema", async () => {
    const res = await post({ bookId: BOOK_ID, price: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.price).toBe("unrecognized_keys");
  });

  it("names the part when the whole body has the wrong type", async () => {
    const res = await post([{ bookId: BOOK_ID }]);

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("body");
  });

  it("rejects a malformed id in the params", async () => {
    const res = await post({ bookId: BOOK_ID }, "zzz");

    expect(res.status).toBe(400);
    expect(res.body.error.fields.id).toBe("invalid_format");
  });

  it("hands the parsed values, defaults included, to the route", async () => {
    const res = await post({ bookId: BOOK_ID });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      params: { id: BOOK_ID },
      body: { bookId: BOOK_ID, quantity: 1 },
    });
  });
});
