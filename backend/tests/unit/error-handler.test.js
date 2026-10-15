import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createErrorHandler } from "../../middleware/errorHandler.js";
import { AppError, NotFoundError } from "../../utils/errors.js";

let log;

beforeEach(() => {
  log = { error: vi.fn(), warn: vi.fn() };
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

// A mini app: GET /boom throws `thrown`, POST /echo parses a JSON body, and the
// handler comes last, as in app.js. These routes exist only for the tests.
function appWith(handler, thrown = new Error("boom")) {
  const app = express();
  app.use(express.json());
  app.get("/boom", () => {
    throw thrown;
  });
  app.post("/echo", (req, res) => res.json({ ok: true }));
  app.use(handler);
  return app;
}

const appLogging = (options, thrown) =>
  appWith(createErrorHandler({ log, ...options }), thrown);

describe("createErrorHandler: unknown errors", () => {
  it("answers 500 INTERNAL without a stack, and logs the stack", async () => {
    const res = await request(appLogging()).get("/boom");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: { code: "INTERNAL", message: "Internal server error" },
    });
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error.mock.calls[0][0]).toMatch(/^Error: boom\n\s+at /);
    expect(log.warn).not.toHaveBeenCalled();
  });

  it("answers with the message and the stack when exposeErrorDetails is true", async () => {
    const res = await request(appLogging({ exposeErrorDetails: true })).get(
      "/boom"
    );

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
    expect(res.body.error.message).toBe("boom");
    expect(typeof res.body.error.stack).toBe("string");
    expect(res.body.error.stack).toContain("Error: boom");
  });

  it("hides the details and logs to the console when created without options", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(appWith(createErrorHandler())).get("/boom");

    expect(res.body).toEqual({
      success: false,
      error: { code: "INTERNAL", message: "Internal server error" },
    });
    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});

describe("createErrorHandler: known errors", () => {
  it("answers an operational error with its status, code and message, and only warns", async () => {
    const res = await request(
      appLogging({}, new NotFoundError("Book not found"))
    ).get("/boom");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Book not found" },
    });
    expect(log.warn).toHaveBeenCalledWith("404 NOT_FOUND");
    expect(log.error).not.toHaveBeenCalled();
  });

  it("passes the code and details of an operational error through", async () => {
    const error = new AppError("x", 409, "BOOK_UNAVAILABLE", {
      details: { a: 1 },
    });

    const res = await request(appLogging({}, error)).get("/boom");

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      error: { code: "BOOK_UNAVAILABLE", message: "x", details: { a: 1 } },
    });
  });

  it.each([
    [
      "a validation error",
      Object.assign(new Error("Book validation failed"), {
        name: "ValidationError",
        errors: {
          price: { path: "price", kind: "min", message: "Price cannot be negative" },
        },
      }),
      400,
      { code: "VALIDATION_FAILED", message: "Validation failed", fields: { price: "min" } },
    ],
    [
      "a cast error",
      Object.assign(new Error('Cast to ObjectId failed for value "zzz"'), {
        name: "CastError",
        path: "_id",
        value: "zzz",
      }),
      400,
      { code: "VALIDATION_FAILED", message: "Invalid value", fields: { _id: "invalid" } },
    ],
    [
      "a duplicate key error",
      Object.assign(new Error('E11000 duplicate key dup key: { email: "a@b.c" }'), {
        code: 11000,
        keyPattern: { email: 1 },
        keyValue: { email: "a@b.c" },
      }),
      409,
      { code: "CONFLICT", message: "Duplicate value", fields: { email: "duplicate" } },
    ],
  ])("answers %s in the envelope and warns with the code only", async (kind, error, status, body) => {
    const res = await request(appLogging({}, error)).get("/boom");

    expect(res.status).toBe(status);
    expect(res.body).toEqual({ success: false, error: body });
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith(`${status} ${body.code}`);
    expect(log.error).not.toHaveBeenCalled();
  });

  it.each([
    ["a cast error", "zzz"],
    ["a duplicate key error", "a@b.c"],
  ])("never logs the request value of %s", async (kind, value) => {
    const error =
      kind === "a cast error"
        ? Object.assign(new Error(`Cast to ObjectId failed for value "${value}"`), {
            name: "CastError",
            path: "_id",
            value,
          })
        : Object.assign(new Error(`E11000 dup key: { email: "${value}" }`), {
            code: 11000,
            keyPattern: { email: 1 },
            keyValue: { email: value },
          });

    await request(appLogging({}, error)).get("/boom");

    expect(JSON.stringify(log.warn.mock.calls)).not.toContain(value);
  });
});

describe("createErrorHandler: log level follows the response status", () => {
  it("warns about an unknown error that carries a 4xx status, as UNKNOWN", async () => {
    const teapot = Object.assign(new Error("teapot"), { statusCode: 418 });

    const res = await request(appLogging({}, teapot)).get("/boom");

    expect(res.status).toBe(418);
    expect(res.body.error.code).toBe("UNKNOWN");
    expect(log.warn).toHaveBeenCalledWith("418 UNKNOWN");
    expect(log.error).not.toHaveBeenCalled();
  });

  it("logs the stack of an operational error that carries a 5xx status", async () => {
    const res = await request(appLogging({}, new AppError("down", 503))).get(
      "/boom"
    );

    expect(res.status).toBe(503);
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error.mock.calls[0][0]).toMatch(/^Error: down\n\s+at /);
    expect(log.warn).not.toHaveBeenCalled();
  });
});

describe("createErrorHandler: request data in the log", () => {
  const secret = "hunter2";

  it("answers a malformed JSON body with VALIDATION_FAILED and logs its type, never its message", async () => {
    // Unquoted value: V8 quotes short invalid input in its SyntaxError message,
    // so a log line built from err.message would contain the password
    const body = `{"password":${secret}}`;

    const res = await request(appLogging())
      .post("/echo")
      .set("Content-Type", "application/json")
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: { code: "VALIDATION_FAILED", message: "Malformed request body" },
    });
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith("400 VALIDATION_FAILED entity.parse.failed");
    expect(log.error).not.toHaveBeenCalled();
    expect(
      JSON.stringify([res.body, log.warn.mock.calls, log.error.mock.calls])
    ).not.toContain(secret);
  });
});

describe("errorHandler, the instance app.js mounts", () => {
  // The instance reads config.exposeErrorDetails, which comes from
  // EXPOSE_ERROR_DETAILS (the test worker runs with NODE_ENV=test)
  it.each([
    ["true", "boom"],
    ["", "Internal server error"],
  ])("with EXPOSE_ERROR_DETAILS=%j answers %j", async (value, expected) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("EXPOSE_ERROR_DETAILS", value);
    vi.resetModules();
    const { errorHandler } = await import("../../middleware/errorHandler.js");

    const res = await request(appWith(errorHandler)).get("/boom");

    expect(res.body.error.message).toBe(expected);
  });
});
