import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { config } from "../../config/index.js";
import Book from "../../models/Book.js";
import Order from "../../models/Order.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createBook } from "../helpers/factories.js";

useTestDatabase();

const ADDRESS = {
  fullName: "Jan Novák",
  line1: "Vodičkova 12",
  city: "Praha",
  postalCode: "110 00",
  country: "CZ",
  phone: "+420 777 123 456",
};

const CONTRACT_KEYS = [
  "createdAt",
  "id",
  "items",
  "orderNumber",
  "paymentStatus",
  "quote",
  "shippingAddress",
  "status",
  "statusHistory",
].sort();

let token;
let book;

const as = (req, bearer = token) => req.set("Authorization", `Bearer ${bearer}`);
const getCart = (bearer) => as(request(app).get("/api/v1/cart"), bearer);
const addToCart = (bookId, bearer) =>
  as(request(app).post("/api/v1/cart"), bearer).send({ bookId, quantity: 1 });
const place = (body, key = randomUUID(), bearer = token) =>
  as(request(app).post("/api/v1/orders"), bearer).set("Idempotency-Key", key).send(body);

async function cartTotal(bearer) {
  return (await getCart(bearer)).body.data.quote.total;
}

async function validBody(bearer) {
  return { shippingAddress: { ...ADDRESS }, expectedTotal: await cartTotal(bearer) };
}

beforeEach(async () => {
  token = await loginAs(app, await createUser());
  book = await createBook({ price: 199 });
  await addToCart(book._id.toString());
});

describe("POST /api/v1/orders", () => {
  it("creates a pending unpaid order from the cart", async () => {
    const cartBefore = (await getCart()).body.data;

    const res = await place(await validBody());

    expect(res.status).toBe(201);
    const order = res.body.data;
    expect(Object.keys(order).sort()).toEqual(CONTRACT_KEYS);
    expect(order.orderNumber).toMatch(/^ORD-\d{8}-\d{6}$/);
    expect(order).toMatchObject({ status: "pending", paymentStatus: "unpaid", shippingAddress: ADDRESS });
    expect(order.items).toEqual([
      { bookId: book._id.toString(), title: book.title, unitPrice: 19900, quantity: 1, lineTotal: 19900 },
    ]);
    const { freeShippingThreshold, ...quote } = cartBefore.quote;
    expect(order.quote).toEqual(quote);
    expect(order.statusHistory).toEqual([
      { axis: "status", from: null, to: "pending", by: "user", at: expect.any(String) },
    ]);
    expect((await getCart()).body.data.items).toEqual([]);
  });

  it("the same key and body return the same order with 200", async () => {
    const key = randomUUID();
    const body = await validBody();

    const first = await place(body, key);
    const second = await place(body, key);

    expect([first.status, second.status]).toEqual([201, 200]);
    expect(second.body.data).toEqual(first.body.data);
    expect(await Order.countDocuments()).toBe(1);
  });

  it("the key is matched in any letter case", async () => {
    const key = randomUUID();
    const body = await validBody();

    const first = await place(body, key);
    const second = await place(body, key.toUpperCase());

    expect(second.status).toBe(200);
    expect(second.body.data.id).toBe(first.body.data.id);
  });

  it("a body that differs only by surrounding spaces is the same body", async () => {
    const key = randomUUID();
    const body = await validBody();

    const first = await place(body, key);
    const second = await place(
      { ...body, shippingAddress: { ...ADDRESS, fullName: `  ${ADDRESS.fullName} ` } },
      key
    );

    expect(second.status).toBe(200);
    expect(second.body.data.id).toBe(first.body.data.id);
  });

  it("the same key with another body is a conflict", async () => {
    const key = randomUUID();
    const body = await validBody();
    await place(body, key);

    const res = await place({ ...body, shippingAddress: { ...ADDRESS, fullName: "Eva Nová" } }, key);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("IDEMPOTENCY_CONFLICT");
    expect(await Order.countDocuments()).toBe(1);
  });

  it("two parallel requests with one key create one order", async () => {
    const key = randomUUID();
    const body = await validBody();

    const responses = await Promise.all([place(body, key), place(body, key)]);

    expect(responses.map((res) => res.status).sort()).toEqual([200, 201]);
    expect(responses[0].body.data.id).toBe(responses[1].body.data.id);
    expect(await Order.countDocuments()).toBe(1);
  });

  it("twenty users order at once and get twenty numbers", async () => {
    const tokens = [];
    for (let i = 0; i < 20; i += 1) {
      const bearer = await loginAs(app, await createUser());
      await addToCart(book._id.toString(), bearer);
      tokens.push(bearer);
    }
    const bodies = await Promise.all(tokens.map((bearer) => validBody(bearer)));

    const responses = await Promise.all(
      tokens.map((bearer, i) => place(bodies[i], randomUUID(), bearer))
    );

    expect(responses.map((res) => res.status)).toEqual(Array(20).fill(201));
    expect(new Set(responses.map((res) => res.body.data.orderNumber)).size).toBe(20);
  });

  it("rejects a missing or malformed key", async () => {
    const body = await validBody();

    const missing = await as(request(app).post("/api/v1/orders")).send(body);
    const malformed = await place(body, "abc");

    expect(missing.status).toBe(400);
    expect(missing.body.error.fields).toEqual({ "Idempotency-Key": "required" });
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.fields).toEqual({ "Idempotency-Key": "invalid_format" });
    expect(await Order.countDocuments()).toBe(0);
  });

  const withAddress = (change) => (body) => ({
    ...body,
    shippingAddress: { ...body.shippingAddress, ...change },
  });

  it.each([
    ["a short postal code", withAddress({ postalCode: "1100" }), "shippingAddress.postalCode"],
    ["a short phone", withAddress({ phone: "12345" }), "shippingAddress.phone"],
    ["a one-letter name", withAddress({ fullName: "J" }), "shippingAddress.fullName"],
    ["a line break in the city", withAddress({ city: "Pra\nha" }), "shippingAddress.city"],
    ["a NUL in the street", withAddress({ line1: "Vodičkova\u000012" }), "shippingAddress.line1"],
    ["an operator object as a name", withAddress({ fullName: { $gt: "" } }), "shippingAddress.fullName"],
    ["another country", withAddress({ country: "SK" }), "shippingAddress.country"],
    ["an address array", (body) => ({ ...body, shippingAddress: [] }), "shippingAddress"],
    ["a total as a string", (body) => ({ ...body, expectedTotal: "100" }), "expectedTotal"],
    ["a fractional total", (body) => ({ ...body, expectedTotal: 1.5 }), "expectedTotal"],
    ["a negative total", (body) => ({ ...body, expectedTotal: -1 }), "expectedTotal"],
    ["NaN as a total", (body) => ({ ...body, expectedTotal: "NaN" }), "expectedTotal"],
    ["a payment method", (body) => ({ ...body, paymentMethod: "card" }), "paymentMethod"],
  ])("rejects %s with VALIDATION_FAILED", async (_, change, field) => {
    const res = await place(change(await validBody()));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(res.body.error.fields).toHaveProperty([field]);
    expect(await Order.countDocuments()).toBe(0);
  });

  it.each([
    ["a postal code without a space", { postalCode: "11000" }],
    ["a phone without a prefix", { phone: "777123456" }],
  ])("accepts %s", async (_, change) => {
    const body = await validBody();

    const res = await place({ ...body, shippingAddress: { ...ADDRESS, ...change } });

    expect(res.status).toBe(201);
  });

  it("an empty cart is unprocessable", async () => {
    const body = await validBody();
    await as(request(app).delete("/api/v1/cart"));

    const res = await place(body);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("CART_EMPTY");
  });

  it("a cart with an unavailable book is unprocessable", async () => {
    const body = await validBody();
    await Book.updateOne({ _id: book._id }, { inStock: false });

    const res = await place(body);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("CART_HAS_UNAVAILABLE_ITEMS");
    expect(res.body.error.details).toEqual({
      items: [{ bookId: book._id.toString(), reason: "OUT_OF_STOCK" }],
    });
    expect(await Order.countDocuments()).toBe(0);
  });

  it("a stale total gets the current quote, and the same key then places the order", async () => {
    const key = randomUUID();
    const body = await validBody();

    const stale = await place({ ...body, expectedTotal: body.expectedTotal - 1 }, key);
    const confirmed = await place(body, key);

    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe("PRICE_CHANGED");
    expect(stale.body.error.details.quote.total).toBe(body.expectedTotal);
    expect(confirmed.status).toBe(201);
  });

  it("the preflight allows the Idempotency-Key header", async () => {
    const res = await request(app)
      .options("/api/v1/orders")
      .set("Origin", config.cors.origin)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type,authorization,idempotency-key");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-headers"]).toContain("Idempotency-Key");
  });
});
