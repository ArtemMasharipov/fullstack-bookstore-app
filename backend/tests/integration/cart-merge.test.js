import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import Book from "../../models/Book.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createBook } from "../helpers/factories.js";

useTestDatabase();

let token;

beforeEach(async () => {
  token = await loginAs(app, await createUser());
});

const auth = (req) => req.set("Authorization", `Bearer ${token}`);
const merge = (items) =>
  auth(request(app).post("/api/v1/cart/merge")).send({ items });

describe("POST /api/v1/cart/merge", () => {
  it("adds the guest cart to the account cart, capped at 99, and reports what it skipped", async () => {
    const a = (await createBook({ title: "Krakatit" }))._id.toString();
    const b = (await createBook({ title: "Matka" }))._id.toString();
    const c = (await createBook({ title: "Bílá nemoc", inStock: false }))._id.toString();
    const d = (await createBook({ title: "Továrna na absolutno" }))._id.toString();
    await Book.deleteOne({ _id: d });
    await auth(request(app).post("/api/v1/cart")).send({ bookId: a, quantity: 2 });

    const res = await merge([
      { bookId: a, quantity: 98 },
      { bookId: b, quantity: 1 },
      { bookId: b, quantity: 2 },
      { bookId: c, quantity: 1 },
      { bookId: d, quantity: 1 },
    ]);

    expect(res.status).toBe(200);
    expect(res.body.data.report).toEqual({
      added: [b],
      merged: [a],
      skipped: [
        { bookId: c, reason: "OUT_OF_STOCK" },
        { bookId: d, reason: "DELETED" },
      ],
    });
    expect(
      res.body.data.cart.items.map(({ bookId, quantity }) => ({ bookId, quantity }))
    ).toEqual([
      { bookId: a, quantity: 99 },
      { bookId: b, quantity: 3 },
    ]);
  });

  it("leaves the cart as it is for an empty guest cart", async () => {
    const a = (await createBook())._id.toString();
    await auth(request(app).post("/api/v1/cart")).send({ bookId: a });

    const res = await merge([]);

    expect(res.status).toBe(200);
    expect(res.body.data.report).toEqual({ added: [], merged: [], skipped: [] });
    expect(res.body.data.cart.items).toHaveLength(1);
  });

  it("answers 401 without a token", async () => {
    const res = await request(app).post("/api/v1/cart/merge").send({ items: [] });

    expect(res.status).toBe(401);
  });

  it("refuses more than 50 lines", async () => {
    const items = Array.from({ length: 51 }, () => ({
      bookId: "64b7f0c2a1b2c3d4e5f60718",
      quantity: 1,
    }));

    const res = await merge(items);

    expect(res.status).toBe(400);
  });
});
