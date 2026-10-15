import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import Author from "../../models/Author.js";
import Book from "../../models/Book.js";
import Cart from "../../models/Cart.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createBook } from "../helpers/factories.js";

useTestDatabase();

const MISSING_ID = "64b7f0c2a1b2c3d4e5f60718";

const emptyQuote = {
  currency: "CZK",
  itemsTotal: 0,
  shipping: 0,
  vatIncluded: true,
  vatAmount: 0,
  total: 0,
  freeShippingThreshold: 100000,
};

let user;
let token;

beforeEach(async () => {
  user = await createUser();
  token = await loginAs(app, user);
});

const auth = (req) => req.set("Authorization", `Bearer ${token}`);
const getCart = () => auth(request(app).get("/api/v1/cart"));
const addItem = (body) => auth(request(app).post("/api/v1/cart")).send(body);
const setQuantity = (bookId, body) =>
  auth(request(app).put(`/api/v1/cart/${bookId}`)).send(body);
const removeItem = (bookId) => auth(request(app).delete(`/api/v1/cart/${bookId}`));

// Every key of every object in the response, at any depth
function keysOf(value) {
  if (Array.isArray(value)) return value.flatMap(keysOf);
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => [key, ...keysOf(child)]);
  }
  return [];
}

describe("GET /api/v1/cart", () => {
  it("answers an empty cart with a zero quote for a new user", async () => {
    const res = await getCart();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { items: [], quote: emptyQuote } });
  });
});

describe("POST /api/v1/cart", () => {
  it("adds one copy per call and prices the line in geller", async () => {
    const book = await createBook({ price: 10.99 });
    const bookId = book._id.toString();

    await addItem({ bookId });
    await addItem({ bookId });
    const res = await addItem({ bookId });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([
      {
        bookId,
        title: "R.U.R.",
        authorName: "Karel Čapek",
        image: null,
        unitPrice: 1099,
        quantity: 3,
        lineTotal: 3297,
        available: true,
        unavailableReason: null,
      },
    ]);
    expect(res.body.data.quote.total).toBe(3297 + 9900);
    expect(keysOf(res.body)).not.toContain("_id");
    expect(keysOf(res.body)).not.toContain("__v");
  });

  it("refuses to go past 99 copies of one book", async () => {
    const bookId = (await createBook())._id.toString();
    await addItem({ bookId, quantity: 99 });

    const res = await addItem({ bookId, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(res.body.error.fields.quantity).toBe("too_big");
  });

  it("answers BOOK_UNAVAILABLE for a book that is out of stock", async () => {
    const bookId = (await createBook({ inStock: false }))._id.toString();

    const res = await addItem({ bookId });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("BOOK_UNAVAILABLE");
  });

  it("answers NOT_FOUND for a well-formed id of no book", async () => {
    const res = await addItem({ bookId: MISSING_ID });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("PUT /api/v1/cart/:bookId", () => {
  it("sets the quantity of a line", async () => {
    const bookId = (await createBook())._id.toString();
    await addItem({ bookId });

    const res = await setQuantity(bookId, { quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].quantity).toBe(5);
  });

  it("answers CART_ITEM_NOT_FOUND for a book that is not in the cart", async () => {
    const bookId = (await createBook())._id.toString();

    const res = await setQuantity(bookId, { quantity: 5 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CART_ITEM_NOT_FOUND");
  });

  it("refuses a quantity sent as a string", async () => {
    const bookId = (await createBook())._id.toString();
    await addItem({ bookId });

    const res = await setQuantity(bookId, { quantity: "5" });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("quantity");
  });
});

describe("DELETE /api/v1/cart/:bookId and DELETE /api/v1/cart", () => {
  it("removes a line once, then answers CART_ITEM_NOT_FOUND", async () => {
    const bookId = (await createBook())._id.toString();
    await addItem({ bookId });

    const first = await removeItem(bookId);
    const second = await removeItem(bookId);

    expect(first.status).toBe(200);
    expect(first.body.data.items).toEqual([]);
    expect(second.status).toBe(404);
    expect(second.body.error.code).toBe("CART_ITEM_NOT_FOUND");
  });

  it("empties the cart, even when the user never had one", async () => {
    const res = await auth(request(app).delete("/api/v1/cart"));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ items: [], quote: emptyQuote });
  });
});

describe("lines that can no longer be bought", () => {
  it("marks a book deleted after it was added, and leaves it out of the total", async () => {
    const kept = await createBook({ price: 100 });
    const deleted = await createBook({ title: "Krakatit", price: 200 });
    await addItem({ bookId: kept._id.toString() });
    await addItem({ bookId: deleted._id.toString() });
    await Book.deleteOne({ _id: deleted._id });

    const res = await getCart();

    expect(res.status).toBe(200);
    expect(res.body.data.items[1]).toEqual({
      bookId: deleted._id.toString(),
      title: null,
      authorName: null,
      image: null,
      unitPrice: 0,
      quantity: 1,
      lineTotal: 0,
      available: false,
      unavailableReason: "DELETED",
    });
    expect(res.body.data.quote.itemsTotal).toBe(10000);
  });

  it("answers a null author name when the author was deleted", async () => {
    const book = await createBook();
    await addItem({ bookId: book._id.toString() });
    await Author.deleteOne({ _id: book.author });

    const res = await getCart();

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].authorName).toBeNull();
  });

  it("marks a book that went out of stock, and lets the user remove it", async () => {
    const book = await createBook();
    const bookId = book._id.toString();
    await addItem({ bookId });
    await Book.updateOne({ _id: book._id }, { inStock: false });

    const res = await getCart();
    const removed = await removeItem(bookId);

    expect(res.body.data.items[0]).toMatchObject({
      available: false,
      unavailableReason: "OUT_OF_STOCK",
    });
    expect(res.body.data.quote.itemsTotal).toBe(0);
    expect(removed.status).toBe(200);
  });
});

describe("a cart saved by the previous version", () => {
  it("is read with current prices, and loses its old fields on the next write", async () => {
    const book = await createBook({ price: 249.9 });
    await Cart.collection.insertOne({
      user: user._id,
      items: [{ book: book._id, quantity: 2, price: 1.5 }],
      totalItems: 2,
      totalPrice: 3,
    });

    const res = await getCart();
    await setQuantity(book._id.toString(), { quantity: 3 });
    const stored = await Cart.collection.findOne({ user: user._id });

    expect(res.status).toBe(200);
    expect(res.body.data.items[0]).toMatchObject({ unitPrice: 24990, quantity: 2 });
    expect(stored).not.toHaveProperty("totalPrice");
    expect(stored).not.toHaveProperty("totalItems");
    expect(stored.items).toEqual([{ book: book._id, quantity: 3 }]);
  });
});

describe("POST /api/v1/cart/quote", () => {
  const quote = (body) => request(app).post("/api/v1/cart/quote").send(body);

  it("prices a guest cart without a token, joins repeated books and stores nothing", async () => {
    const bookId = (await createBook({ price: 10 }))._id.toString();

    const res = await quote({
      items: [
        { bookId, quantity: 2 },
        { bookId, quantity: 3 },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]).toMatchObject({ bookId, quantity: 5, lineTotal: 5000 });
    expect(await Cart.countDocuments()).toBe(0);
  });

  it("refuses more than 50 lines", async () => {
    const items = Array.from({ length: 51 }, () => ({ bookId: MISSING_ID, quantity: 1 }));

    const res = await quote({ items });

    expect(res.status).toBe(400);
  });

  it("refuses a line with a price in it", async () => {
    const res = await quote({ items: [{ bookId: MISSING_ID, quantity: 1, price: 1 }] });

    expect(res.status).toBe(400);
    expect(res.body.error.fields["items.0.price"]).toBe("unrecognized_keys");
  });
});

describe("access and removed routes", () => {
  it.each([
    ["get", "/api/v1/cart"],
    ["post", "/api/v1/cart"],
    ["put", `/api/v1/cart/${MISSING_ID}`],
    ["delete", `/api/v1/cart/${MISSING_ID}`],
    ["delete", "/api/v1/cart"],
  ])("%s %s answers 401 without a token", async (method, path) => {
    const res = await request(app)[method](path).send({});

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it.each([
    ["get", "/api/v1/cart/validate"],
    ["post", "/api/v1/cart/sync"],
  ])("%s %s no longer exists", async (method, path) => {
    const res = await auth(request(app)[method](path)).send({});

    expect(res.status).toBe(404);
  });
});
