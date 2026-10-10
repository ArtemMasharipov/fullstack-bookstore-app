import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequestLogger } from "../../middleware/requestLogger.js";

let lines;
let app;

// Same order as app.js: body parsers first, then the logger
beforeEach(() => {
  lines = [];
  app = express();
  app.use(express.json());
  app.use(createRequestLogger({ log: (line) => lines.push(line) }));

  app.get("/items", (req, res) => res.json({ ok: true }));
  app.post("/items", (req, res) => res.status(201).json({ ok: true }));

  const api = express.Router();
  api.get("/items/:id", (req, res) => res.json({ ok: true }));
  app.use("/api/v1", api);
});

// "finish" fires once the response is flushed; wait for the line instead of
// relying on the order of the client's and the server's events
const loggedLine = async () => {
  await vi.waitFor(() => expect(lines).toHaveLength(1));
  return lines[0];
};

describe("createRequestLogger", () => {
  it("logs method, path, status and duration, without query or headers", async () => {
    await request(app)
      .get("/items?token=abc")
      .set("Authorization", "Bearer secret-token");

    const line = await loggedLine();
    expect(line).toMatch(/^GET \/items 200 \d+ms$/);
    expect(line).not.toContain("token=abc");
    expect(line).not.toContain("Bearer");
  });

  it("does not log the request body", async () => {
    await request(app).post("/items").send({ password: "p@ss" });

    const line = await loggedLine();
    expect(line).toMatch(/^POST \/items 201 \d+ms$/);
    expect(line).not.toContain("p@ss");
  });

  it("logs the full path of a request handled by a mounted router", async () => {
    await request(app).get("/api/v1/items/42?token=abc");

    expect(await loggedLine()).toMatch(/^GET \/api\/v1\/items\/42 200 \d+ms$/);
  });

  it("logs the status of an unmatched route", async () => {
    await request(app).get("/missing");

    expect(await loggedLine()).toMatch(/^GET \/missing 404 \d+ms$/);
  });
});
