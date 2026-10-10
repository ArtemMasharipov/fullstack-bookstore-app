/**
 * Global Error Handler Middleware
 * Handles all errors in the application
 * MUST be the last middleware in app.js
 */

import { config } from "../config/index.js";

/**
 * Builds the error handler.
 * Each error is logged once, by the status it is answered with: 5xx with its
 * stack, anything below as a single warn line. The response of an unknown error
 * says "Internal server error" and carries no stack, unless exposeErrorDetails.
 */
export function createErrorHandler({
  exposeErrorDetails = false,
  log = console,
} = {}) {
  const report = (err, status) => {
    if (status >= 500) {
      log.error(err.stack);
      return;
    }
    // body-parser errors (a string `type`, e.g. entity.parse.failed) quote the
    // request body in their message, and the body may hold a password
    const reason = typeof err.type === "string" ? err.type : err.message;
    log.warn(`${status} ${reason}`);
  };

  return (err, req, res, next) => {
    const send = (status, body) => {
      report(err, status);
      return res.status(status).json(body);
    };

    // Mongoose validation error
    if (err.name === "ValidationError") {
      return send(400, {
        success: false,
        error: "Validation error",
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }

    // Mongoose CastError (invalid ID format)
    if (err.name === "CastError") {
      return send(400, {
        success: false,
        error: "Invalid ID format",
      });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return send(409, {
        success: false,
        error: `Duplicate value for field: ${field}`,
      });
    }

    // Our custom operational errors
    if (err.isOperational) {
      return send(err.statusCode, {
        success: false,
        error: err.message,
      });
    }

    // Unknown/programming errors - don't leak details unless asked to
    send(err.statusCode || 500, {
      success: false,
      error: exposeErrorDetails ? err.message : "Internal server error",
      ...(exposeErrorDetails && { stack: err.stack }),
    });
  };
}

export const errorHandler = createErrorHandler({
  exposeErrorDetails: config.exposeErrorDetails,
});
