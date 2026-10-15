import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createBook } from "../helpers/factories.js";

useTestDatabase();

let token;

beforeEach(async () => {
  token = await loginAs(app, await createUser());
});

const auth = (req) => req.set("Authorization", `Bearer ${token}`);
const getCart = () => auth(request(app).get("/api/v1/cart"));
const addItem = (bookId, quantity) =>
  auth(request(app).post("/api/v1/cart")).send({ bookId, quantity });
const mergeItems = (items) => auth(request(app).post("/api/v1/cart/merge")).send({ items });
const removeItem = (bookId) => auth(request(app).delete(`/api/v1/cart/${bookId}`));

async function quantities() {
  const res = await getCart();
  return Object.fromEntries(res.body.data.items.map((line) => [line.bookId, line.quantity]));
}

describe("parallel cart changes", () => {
  it("ten parallel additions of one copy end with ten copies", async () => {
    const bookId = (await createBook())._id.toString();

    const responses = await Promise.all(Array.from({ length: 10 }, () => addItem(bookId, 1)));

    expect(responses.map((res) => res.status)).toEqual(Array(10).fill(200));
    expect(await quantities()).toEqual({ [bookId]: 10 });
  });

  it("parallel additions of two books keep both", async () => {
    const first = (await createBook())._id.toString();
    const second = (await createBook())._id.toString();

    await Promise.all([addItem(first, 1), addItem(second, 2)]);

    expect(await quantities()).toEqual({ [first]: 1, [second]: 2 });
  });

  it("parallel additions past the cap: one is refused, the cap holds", async () => {
    const bookId = (await createBook())._id.toString();

    const responses = await Promise.all([addItem(bookId, 60), addItem(bookId, 60)]);
    const statuses = responses.map((res) => res.status).sort();
    const refused = responses.find((res) => res.status === 400);

    expect(statuses).toEqual([200, 400]);
    expect(refused.body.error.fields).toEqual({ quantity: "too_big" });
    expect(await quantities()).toEqual({ [bookId]: 60 });
  });

  it("a merge and an addition at the same time add up", async () => {
    const bookId = (await createBook())._id.toString();

    await Promise.all([mergeItems([{ bookId, quantity: 2 }]), addItem(bookId, 1)]);

    expect(await quantities()).toEqual({ [bookId]: 3 });
  });

  it("removing one book while adding another keeps the addition", async () => {
    const kept = (await createBook())._id.toString();
    const removed = (await createBook())._id.toString();
    await addItem(removed, 1);

    await Promise.all([removeItem(removed), addItem(kept, 1)]);

    expect(await quantities()).toEqual({ [kept]: 1 });
  });
});
