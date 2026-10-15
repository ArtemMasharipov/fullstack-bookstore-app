import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../app.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createBook } from "../helpers/factories.js";

// Runs once, right after the order service has read the cart and before it
// empties the ordered lines: the moment another tab could change the cart
const afterCartRead = vi.hoisted(() => ({ change: null }));

vi.mock("../../services/cartService.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getCartView: async (userId) => {
      const view = await actual.getCartView(userId);
      const change = afterCartRead.change;
      afterCartRead.change = null;
      if (change) await change(actual, userId);
      return view;
    },
  };
});

useTestDatabase();

let token;

beforeEach(async () => {
  token = await loginAs(app, await createUser());
});

const as = (req) => req.set("Authorization", `Bearer ${token}`);

describe("emptying the cart after an order", () => {
  it("lines changed during the order stay in the cart", async () => {
    const ordered = (await createBook({ price: 199 }))._id.toString();
    const addedMeanwhile = (await createBook({ price: 249 }))._id.toString();
    await as(request(app).post("/api/v1/cart")).send({ bookId: ordered, quantity: 1 });
    const { total } = (await as(request(app).get("/api/v1/cart"))).body.data.quote;

    afterCartRead.change = async (cart, userId) => {
      await cart.setItemQuantity(userId, ordered, 3);
      await cart.addItem(userId, { bookId: addedMeanwhile, quantity: 1 });
    };
    const res = await as(request(app).post("/api/v1/orders"))
      .set("Idempotency-Key", randomUUID())
      .send({
        shippingAddress: {
          fullName: "Jan Novák",
          line1: "Vodičkova 12",
          city: "Praha",
          postalCode: "110 00",
          country: "CZ",
          phone: "+420 777 123 456",
        },
        expectedTotal: total,
      });
    const cart = (await as(request(app).get("/api/v1/cart"))).body.data;

    expect(res.status).toBe(201);
    expect(res.body.data.items).toMatchObject([{ bookId: ordered, quantity: 1 }]);
    expect(cart.items.map(({ bookId, quantity }) => ({ bookId, quantity }))).toEqual([
      { bookId: ordered, quantity: 3 },
      { bookId: addedMeanwhile, quantity: 1 },
    ]);
  });
});
