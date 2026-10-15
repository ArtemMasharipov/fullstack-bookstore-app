/**
 * Custom Error Classes for Application
 * These errors are operational (expected) and will be handled gracefully.
 * Each carries a stable code that the client translates; `fields` maps a
 * request field to the rule it broke, `details` is the payload of the code.
 */

export class AppError extends Error {
  constructor(message, statusCode, code = "INTERNAL", { fields, details } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, fields) {
    super(message, 400, "VALIDATION_FAILED", { fields });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message, code = "CONFLICT", details) {
    super(message, 409, code, { details });
  }
}

export class UnprocessableError extends AppError {
  constructor(message, code = "UNPROCESSABLE", details) {
    super(message, 422, code, { details });
  }
}
