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
  it("answers 500 'Internal server error' without a stack, and logs the stack", async () => {
    const res = await request(appLogging()).get("/boom");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: "Internal server error" });
    expect(res.body).not.toHaveProperty("stack");
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error.mock.calls[0][0]).toMatch(/^Error: boom\n\s+at /);
    expect(log.warn).not.toHaveBeenCalled();
  });

  it("answers with the message and the stack when exposeErrorDetails is true", async () => {
    const res = await request(appLogging({ exposeErrorDetails: true })).get(
      "/boom"
    );

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("boom");
    expect(typeof res.body.stack).toBe("string");
    expect(res.body.stack).toContain("Error: boom");
  });

  it("hides the details and logs to the console when created without options", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(appWith(createErrorHandler())).get("/boom");

    expect(res.body).toEqual({ success: false, error: "Internal server error" });
    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});

describe("createErrorHandler: known errors", () => {
  it("answers an operational error with its status and message, and only warns", async () => {
    const res = await request(appLogging({}, new NotFoundError("missing"))).get(
      "/boom"
    );

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("missing");
    expect(log.warn).toHaveBeenCalledWith("404 missing");
    expect(log.error).not.toHaveBeenCalled();
  });

  it.each([
    [
      "a validation error",
      Object.assign(new Error("Book validation failed"), {
        name: "ValidationError",
        errors: { title: { message: "Title is required" } },
      }),
      400,
      { success: false, error: "Validation error", errors: ["Title is required"] },
    ],
    [
      "a cast error",
      Object.assign(new Error("Cast to ObjectId failed"), { name: "CastError" }),
      400,
      { success: false, error: "Invalid ID format" },
    ],
    [
      "a duplicate key error",
      Object.assign(new Error("E11000 duplicate key"), {
        code: 11000,
        keyPattern: { email: 1 },
      }),
      409,
      { success: false, error: "Duplicate value for field: email" },
    ],
  ])("keeps the response for %s", async (kind, error, status, body) => {
    const res = await request(appLogging({}, error)).get("/boom");

    expect(res.status).toBe(status);
    expect(res.body).toEqual(body);
    expect(log.warn).toHaveBeenCalledWith(`${status} ${error.message}`);
    expect(log.error).not.toHaveBeenCalled();
  });
});

describe("createErrorHandler: log level follows the response status", () => {
  it("warns about an unknown error that carries a 4xx status", async () => {
    const teapot = Object.assign(new Error("teapot"), { statusCode: 418 });

    const res = await request(appLogging({}, teapot)).get("/boom");

    expect(res.status).toBe(418);
    expect(log.warn).toHaveBeenCalledWith("418 teapot");
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

  it("logs a malformed JSON body by its type, never by its message", async () => {
    // Unquoted value: V8 quotes short invalid input in its SyntaxError message,
    // so a log line built from err.message would contain the password
    const body = `{"password":${secret}}`;

    const res = await request(appLogging())
      .post("/echo")
      .set("Content-Type", "application/json")
      .send(body);

    expect(res.status).toBe(400);
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn).toHaveBeenCalledWith("400 entity.parse.failed");
    expect(log.error).not.toHaveBeenCalled();
    expect(JSON.stringify([log.warn.mock.calls, log.error.mock.calls])).not.toContain(
      secret
    );
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

    expect(res.body.error).toBe(expected);
  });
});
