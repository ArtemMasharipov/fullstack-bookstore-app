import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAuthor, createBook } from "../helpers/factories.js";

useTestDatabase();

let token;
let authorId;

beforeEach(async () => {
  token = await loginAs(app, await createUser({ role: "admin" }));
  authorId = (await createAuthor())._id.toString();
});

const books = () => mongoose.connection.collection("books");
const stored = (id) => books().findOne({ _id: new mongoose.Types.ObjectId(id) });
const create = (price) =>
  request(app)
    .post("/api/v1/books")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "R.U.R.", authorId, publicationYear: 1920, category: "Drama", ...price });
const quoteOf = (bookId, quantity) =>
  request(app).post("/api/v1/cart/quote").send({ items: [{ bookId, quantity }] });

describe("book prices in whole geller", () => {
  it("serves priceMinor with the currency, and the crowns for one more release", async () => {
    const created = await create({ priceMinor: 24990 });
    const { id } = created.body.data;

    const one = await request(app).get(`/api/v1/books/${id}`);
    const list = await request(app).get("/api/v1/books");

    expect(created.status).toBe(201);
    expect(one.body.data).toMatchObject({ priceMinor: 24990, currency: "CZK", price: 249.9 });
    expect(list.body.data.find((book) => book.id === id)).toMatchObject({
      priceMinor: 24990,
      currency: "CZK",
      price: 249.9,
    });
  });

  it("stores whole geller, and the crowns along with them", async () => {
    const created = await create({ priceMinor: 24990 });

    expect(await stored(created.body.data.id)).toMatchObject({ priceMinor: 24990, price: 249.9 });
  });

  it("still takes the crowns an older admin page sends, and stores both", async () => {
    const created = await create({ price: 249.9 });

    expect(created.status).toBe(201);
    expect(await stored(created.body.data.id)).toMatchObject({ priceMinor: 24990, price: 249.9 });
  });

  it.each([
    ["neither price", {}, { priceMinor: "invalid_type" }],
    ["both prices", { price: 249.9, priceMinor: 24990 }, { price: "custom" }],
    ["a fraction of a geller", { priceMinor: 249.9 }, { priceMinor: "invalid_type" }],
    ["too much", { priceMinor: 100000000 }, { priceMinor: "too_big" }],
  ])("refuses %s", async (_name, price, fields) => {
    const res = await create(price);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(res.body.error.fields).toEqual(fields);
  });

  it("prices a book written before priceMinor from its crowns", async () => {
    const book = await createBook();
    await books().updateOne(
      { _id: book._id },
      { $set: { price: 249.89999999999998 }, $unset: { priceMinor: "" } }
    );

    const one = await request(app).get(`/api/v1/books/${book._id}`);
    const quote = await quoteOf(book._id.toString(), 1);

    expect(one.body.data).toMatchObject({ priceMinor: 24990, price: 249.9 });
    expect(quote.body.data.items[0].unitPrice).toBe(24990);
  });

  it("prices the cart from priceMinor when the two fields disagree", async () => {
    const book = await createBook({ price: 249.9 });
    await books().updateOne({ _id: book._id }, { $set: { priceMinor: 30000 } });

    const quote = await quoteOf(book._id.toString(), 2);

    expect(quote.body.data.items[0]).toMatchObject({ unitPrice: 30000, lineTotal: 60000 });
  });
});
