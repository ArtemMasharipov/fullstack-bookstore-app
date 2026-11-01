import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../app.js";
import Cart from "../../models/Cart.js";
import Order from "../../models/Order.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createBook } from "../helpers/factories.js";

// Runs once, right after the order service has read the cart and before it
// stores the order: the moment another tab could change the cart
const afterCartRead = vi.hoisted(() => ({ change: null }));

vi.mock("../../services/cartService.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getCartView: async (userId, options) => {
      const view = await actual.getCartView(userId, options);
      const change = afterCartRead.change;
      afterCartRead.change = null;
      if (change) await change(actual, userId);
      return view;
    },
  };
});

useTestDatabase();

const ADDRESS = {
  fullName: "Jan Novák",
  line1: "Vodičkova 12",
  city: "Praha",
  postalCode: "110 00",
  country: "CZ",
  phone: "+420 777 123 456",
};

let token;

beforeEach(async () => {
  token = await loginAs(app, await createUser());
});

afterEach(() => {
  afterCartRead.change = null;
  vi.restoreAllMocks();
});

const as = (req) => req.set("Authorization", `Bearer ${token}`);
const getCart = async () => (await as(request(app).get("/api/v1/cart"))).body.data;
const addToCart = (bookId, quantity) =>
  as(request(app).post("/api/v1/cart")).send({ bookId, quantity });
const place = (expectedTotal, key = randomUUID()) =>
  as(request(app).post("/api/v1/orders"))
    .set("Idempotency-Key", key)
    .send({ shippingAddress: { ...ADDRESS }, expectedTotal });
const lines = (items) => items.map(({ bookId, quantity }) => ({ bookId, quantity }));

describe("placing an order while the cart changes", () => {
  it("lines changed during checkout send the customer the new total, and the same key then orders them", async () => {
    const ordered = (await createBook({ price: 199 }))._id.toString();
    const addedMeanwhile = (await createBook({ price: 249 }))._id.toString();
    await addToCart(ordered, 1);
    const { total } = (await getCart()).quote;
    const key = randomUUID();

    afterCartRead.change = async (cart, userId) => {
      await cart.setItemQuantity(userId, ordered, 3);
      await cart.addItem(userId, { bookId: addedMeanwhile, quantity: 1 });
    };
    const stale = await place(total, key);
    const cart = await getCart();

    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe("PRICE_CHANGED");
    expect(stale.body.error.details.quote.total).toBe(cart.quote.total);
    expect(await Order.countDocuments()).toBe(0);
    expect(lines(cart.items)).toEqual([
      { bookId: ordered, quantity: 3 },
      { bookId: addedMeanwhile, quantity: 1 },
    ]);

    const confirmed = await place(cart.quote.total, key);

    expect(confirmed.status).toBe(201);
    expect(lines(confirmed.body.data.items)).toEqual([
      { bookId: ordered, quantity: 3 },
      { bookId: addedMeanwhile, quantity: 1 },
    ]);
    expect((await getCart()).items).toEqual([]);
  });

  it.each([
    { changed: "book IDs", initial: [1, 0], next: [0, 1] },
    { changed: "quantities", initial: [1, 2], next: [2, 1] },
  ])("changed $changed need confirmation even when the total stays the same", async ({ initial, next }) => {
    const books = [
      (await createBook({ price: 199 }))._id.toString(),
      (await createBook({ price: 199 }))._id.toString(),
    ];
    for (const [index, quantity] of initial.entries()) {
      if (quantity) await addToCart(books[index], quantity);
    }
    const { total } = (await getCart()).quote;
    const key = randomUUID();
    const expectedLines = books.flatMap((bookId, index) =>
      next[index] ? [{ bookId, quantity: next[index] }] : []
    );

    afterCartRead.change = async (cart, userId) => {
      for (const [index, quantity] of next.entries()) {
        if (!quantity) await cart.removeItem(userId, books[index]);
        else if (!initial[index]) await cart.addItem(userId, { bookId: books[index], quantity });
        else await cart.setItemQuantity(userId, books[index], quantity);
      }
    };
    const stale = await place(total, key);
    const cart = await getCart();

    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe("PRICE_CHANGED");
    expect(stale.body.error.details.quote.total).toBe(total);
    expect(cart.quote.total).toBe(total);
    expect(await Order.countDocuments()).toBe(0);
    expect(lines(cart.items)).toEqual(expectedLines);

    const confirmed = await place(total, key);

    expect(confirmed.status).toBe(201);
    expect(lines(confirmed.body.data.items)).toEqual(expectedLines);
    expect(await Order.countDocuments()).toBe(1);
    expect((await getCart()).items).toEqual([]);
  });

  it("two checkouts of one cart with different keys place one order", async () => {
    const bookId = (await createBook({ price: 199 }))._id.toString();
    await addToCart(bookId, 1);
    const { total } = (await getCart()).quote;

    let second;
    afterCartRead.change = async () => {
      second = await place(total);
    };
    const first = await place(total);

    expect([first.status, second.status].sort()).toEqual([201, 422]);
    const refused = first.status === 422 ? first : second;
    expect(refused.body.error.code).toBe("CART_EMPTY");
    expect(await Order.countDocuments()).toBe(1);
    expect((await getCart()).items).toEqual([]);
  });

  it("a failure after the order is stored rolls back the order and the cart", async () => {
    const bookId = (await createBook({ price: 199 }))._id.toString();
    await addToCart(bookId, 2);
    const before = await getCart();

    vi.spyOn(Cart, "updateOne").mockImplementationOnce(() =>
      Promise.reject(new Error("injected after the order was stored"))
    );
    const res = await place(before.quote.total);

    expect(res.status).toBe(500);
    expect(await Order.countDocuments()).toBe(0);
    expect(lines((await getCart()).items)).toEqual(lines(before.items));
  });
});
