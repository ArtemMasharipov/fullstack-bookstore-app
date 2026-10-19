import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import Book from "../../models/Book.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createBook } from "../helpers/factories.js";

// The admin book update passes the request body to Mongoose as the update.
// Mongoose before 8.24.1 wrote $fullPath to Object.prototype while casting an
// update with a dotted __proto__ path (GHSA-664h-wqgq-64gw).
useTestDatabase();

afterEach(() => {
  // A polluted prototype would leak into every later test of this worker.
  delete Object.prototype.$fullPath;
  delete Object.prototype.$parentSchemaDocArray;
});

describe("PUT /api/v1/books/:id: an update with a dotted __proto__ path", () => {
  it("leaves Object.prototype and the stored book unchanged", async () => {
    const admin = await createUser({ role: "admin" });
    const token = await loginAs(app, admin);
    const book = await createBook();

    const res = await request(app)
      .put(`/api/v1/books/${book.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ $set: { "__proto__.x": "anything" } });

    expect(Object.hasOwn(Object.prototype, "$fullPath")).toBe(false);
    expect(Object.hasOwn(Object.prototype, "$parentSchemaDocArray")).toBe(false);
    expect((await Book.findById(book.id).lean()).title).toBe("R.U.R.");
    // The strict body schema refuses the update before Mongoose sees it.
    expect(res.status).toBe(400);
  });
});
