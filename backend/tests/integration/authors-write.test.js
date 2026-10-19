import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../app.js";
import Author from "../../models/Author.js";
import Book from "../../models/Book.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAuthor, createBook } from "../helpers/factories.js";

useTestDatabase();
const MISSING = "5f0c9a1b2c3d4e5f6a7b8c9d";
const year = new Date().getFullYear();
let token;
let author;
beforeEach(async () => {
  token = await loginAs(app, await createUser({ role: "admin" }));
  author = await createAuthor();
});
const valid = (fields = {}) => ({ firstName: "Jane", lastName: "Writer", ...fields });
const send = (method, path, body) => {
  const req = request(app)[method](`/api/v1/authors${path}`).set("Authorization", `Bearer ${token}`);
  return body === undefined ? req : req.send(body);
};

describe("author write contracts", () => {
  it("creates a trimmed author view without Mongoose fields or message", async () => {
    const res = await send("post", "", valid({ firstName: " Jane ", lastName: " Writer ", bio: " Biography ", country: " CZ ", birthYear: 1900, website: "https://example.com" }));
    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
    expect(Object.keys(res.body.data).sort()).toEqual(["bio", "birthYear", "country", "createdAt", "firstName", "id", "lastName", "updatedAt", "website"]);
    expect(res.body.data).toMatchObject({ firstName: "Jane", lastName: "Writer", bio: "Biography", country: "CZ", birthYear: 1900, website: "https://example.com" });
    expect((await Author.findById(res.body.data.id).lean()).firstName).toBe("Jane");
  });

  it.each([
    { firstName: "ab", lastName: "cd", birthYear: 1000 },
    { firstName: "a".repeat(50), lastName: "b".repeat(50), birthYear: year },
    { bio: "x".repeat(2000), country: "x".repeat(100) },
    { website: "http://example.com" }, { website: "https://example.com" },
  ])("accepts boundary values %j", async (fields) => {
    const res = await send("post", "", valid(fields));
    expect(res.status).toBe(201);
    expect(res.body.data.id).toMatch(/^[a-f0-9]{24}$/);
  });

  it.each([
    [{ firstName: "a" }, "firstName", "too_small"], [{ lastName: " " }, "lastName", "too_small"],
    [{ firstName: "x".repeat(51) }, "firstName", "too_big"], [{ lastName: "x".repeat(51) }, "lastName", "too_big"],
    [{ bio: "x".repeat(2001) }, "bio", "too_big"], [{ country: "x".repeat(101) }, "country", "too_big"],
    [{ birthYear: 999 }, "birthYear", "too_small"], [{ birthYear: year + 1 }, "birthYear", "too_big"],
    [{ birthYear: 1000.5 }, "birthYear", "invalid_type"], [{ birthYear: "1900" }, "birthYear", "invalid_type"],
    [{ birthYear: null }, "birthYear", "invalid_type"], [{ firstName: {} }, "firstName", "invalid_type"],
    [{ bio: null }, "bio", "invalid_type"], [{ country: 4 }, "country", "invalid_type"],
    [{ website: "javascript:alert(1)" }, "website", "invalid_format"],
    [{ website: "data:text/html,test" }, "website", "invalid_format"],
    [{ website: "not a url" }, "website", "invalid_format"], [{ website: "" }, "website", "invalid_format"],
    [{ website: "https://example.com/" + "a".repeat(2030) }, "website", "too_big"],
  ])("refuses invalid author data %j", async (fields, field, code) => {
    const res = await send("post", "", valid(fields));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(res.body.error.fields[field]).toBe(code);
    expect(await Author.countDocuments()).toBe(1);
  });

  it.each(["books", "name", "biography", "_id", "createdAt", "$set"])("refuses unknown %s on create and update", async (field) => {
    for (const [method, path] of [["post", ""], ["put", `/${author.id}`]]) {
      const res = await send(method, path, valid({ [field]: field === "books" ? [] : "injected" }));
      expect(res.status).toBe(400);
      expect(res.body.error.fields[field]).toBe("unrecognized_keys");
    }
    expect((await Author.findById(author.id)).firstName).toBe("Karel");
  });

  it("replaces optional fields and unsets the legacy array in storage", async () => {
    await Author.collection.updateOne({ _id: author._id }, { $set: { bio: "Before", country: "CZ", birthYear: 1890, website: "https://example.com", books: [] } });
    const res = await send("put", `/${author.id}`, valid({ bio: "After" }));
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
    expect(res.body.data).toMatchObject({ id: author.id, firstName: "Jane", lastName: "Writer", bio: "After" });
    const stored = await Author.collection.findOne({ _id: author._id });
    for (const field of ["birthYear", "country", "website", "books"]) expect(stored).not.toHaveProperty(field);
    const cleared = await send("put", `/${author.id}`, valid());
    expect(cleared.body.data.bio).toBe("");
    expect(await Author.collection.findOne({ _id: author._id })).not.toHaveProperty("bio");
  });

  it("requires both names on replacement without changing stored data", async () => {
    const before = await Author.collection.findOne({ _id: author._id });
    const res = await send("put", `/${author.id}`, { firstName: "Changed" });
    expect(res.status).toBe(400);
    expect(await Author.collection.findOne({ _id: author._id })).toEqual(before);
  });

  it("refuses a trimmed duplicate on create and update but accepts its own name", async () => {
    const created = await send("post", "", { firstName: " Karel ", lastName: " Čapek " });
    expect(created.status).toBe(409);
    expect(created.body.error).toMatchObject({ code: "CONFLICT", fields: { lastName: "duplicate" } });
    const other = await createAuthor({ firstName: "Jane", lastName: "Writer" });
    const res = await send("put", `/${other.id}`, { firstName: " Karel ", lastName: " Čapek " });
    expect(res.status).toBe(409);
    expect(res.body.error.fields).toEqual({ lastName: "duplicate" });
    const own = await send("put", `/${author.id}`, { firstName: "Karel", lastName: "Čapek" });
    expect(own.status).toBe(200);
  });

  it("refuses to delete an author with books and reports their count", async () => {
    await createBook({ author: author._id });
    await createBook({ author: author._id });
    const res = await send("delete", `/${author.id}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: "AUTHOR_HAS_BOOKS", details: { books: 2 } });
    expect(await Book.countDocuments({ author: author._id })).toBe(2);
    expect(await Author.exists({ _id: author._id })).not.toBeNull();
  });

  it.each(["true", "false"])("refuses removed deleteBooks=%s without deleting books", async (value) => {
    await createBook({ author: author._id });
    const res = await send("delete", `/${author.id}?deleteBooks=${value}`);
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ deleteBooks: "unrecognized_keys" });
    expect(await Book.countDocuments()).toBe(1);
    expect(await Author.countDocuments()).toBe(1);
  });

  it("deletes an author without books with an empty 204 and then 404", async () => {
    const res = await send("delete", `/${author.id}`);
    expect(res.status).toBe(204);
    expect(res.text).toBe("");
    expect(await Author.exists({ _id: author._id })).toBeNull();
    expect((await send("delete", `/${author.id}`)).status).toBe(404);
  });

  it.each(["post", "put", "delete"])("refuses unknown query parameters on %s", async (method) => {
    const res = await send(method, `${method === "post" ? "" : `/${author.id}`}?extra=1`, method === "delete" ? undefined : valid());
    expect(res.status).toBe(400);
    expect(res.body.error.fields.extra).toBe("unrecognized_keys");
  });
  it.each(["put", "delete"])("validates the id on %s and answers a missing id with 404", async (method) => {
    const body = method === "put" ? valid() : undefined;
    const bad = await send(method, "/bad", body);
    expect(bad.status).toBe(400);
    expect(bad.body.error.fields.id).toBe("invalid_format");
    const missing = await send(method, `/${MISSING}`, body);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe("NOT_FOUND");
  });

  it("refuses a prototype update before it reaches the model", async () => {
    const res = await send("put", `/${author.id}`, { $set: { "__proto__.x": "anything" } });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.$set).toBe("unrecognized_keys");
    expect(Object.hasOwn(Object.prototype, "$fullPath")).toBe(false);
    expect(Object.hasOwn(Object.prototype, "$parentSchemaDocArray")).toBe(false);
    expect((await Author.findById(author.id)).firstName).toBe("Karel");
  });
});
