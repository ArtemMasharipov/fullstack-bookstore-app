/**
 * Global Error Handler Middleware
 * Handles all errors in the application
 * MUST be the last middleware in app.js
 */

import { config } from "../config/index.js";

// The body of an error response: { success: false, error: { code, message,
// fields?, details? } }. Keys that are undefined are left out by JSON.
const envelope = (code, message, extra = {}) => ({
  success: false,
  error: { code, message, ...extra },
});

/**
 * Turns an error into [status, body]. The message of a Mongoose error quotes
 * the request value, so it never reaches the response.
 */
function describe(err, exposeErrorDetails) {
  if (err.name === "ValidationError" && err.errors) {
    const fields = Object.fromEntries(
      Object.values(err.errors).map((e) => [e.path, e.kind])
    );
    return [400, envelope("VALIDATION_FAILED", "Validation failed", { fields })];
  }

  if (err.name === "CastError") {
    return [
      400,
      envelope("VALIDATION_FAILED", "Invalid value", {
        fields: { [err.path]: "invalid" },
      }),
    ];
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0];
    return [
      409,
      envelope("CONFLICT", "Duplicate value", {
        fields: field ? { [field]: "duplicate" } : undefined,
      }),
    ];
  }

  // body-parser errors (a string `type`, e.g. entity.parse.failed)
  if (typeof err.type === "string" && err.status >= 400 && err.status < 500) {
    return [err.status, envelope("VALIDATION_FAILED", "Malformed request body")];
  }

  if (err.isOperational) {
    return [
      err.statusCode,
      envelope(err.code, err.message, { fields: err.fields, details: err.details }),
    ];
  }

  // Unknown/programming errors - don't leak details unless asked to
  const status = err.statusCode || 500;
  return [
    status,
    envelope(
      status >= 500 ? "INTERNAL" : "UNKNOWN",
      exposeErrorDetails ? err.message : "Internal server error",
      exposeErrorDetails ? { stack: err.stack } : {}
    ),
  ];
}

/**
 * Builds the error handler.
 * Each error is logged once, by the status it is answered with: 5xx with its
 * stack, anything below as a single warn line of the status and the code (and
 * the body-parser type). Messages can quote request values (an id from the
 * URL, an email in a duplicate key error, a password in a bad JSON body), so
 * a warn line never contains one.
 */
export function createErrorHandler({
  exposeErrorDetails = false,
  log = console,
} = {}) {
  return (err, req, res, next) => {
    const [status, body] = describe(err, exposeErrorDetails);

    if (status >= 500) {
      log.error(err.stack);
    } else {
      const type = typeof err.type === "string" ? ` ${err.type}` : "";
      log.warn(`${status} ${body.error.code}${type}`);
    }

    return res.status(status).json(body);
  };
}

export const errorHandler = createErrorHandler({
  exposeErrorDetails: config.exposeErrorDetails,
});
