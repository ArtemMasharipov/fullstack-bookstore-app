/**
 * Requires an Idempotency-Key header holding a UUID and puts it, lower-cased,
 * on req.idempotencyKey. A UUID does not depend on letter case, so one key in
 * two spellings is still one key.
 */

import { z } from "zod";
import { ValidationError } from "../utils/errors.js";

const HEADER = "Idempotency-Key";
const uuid = z.uuid();

export function requireIdempotencyKey(req, res, next) {
  const key = req.get(HEADER);
  if (key === undefined || key === "") {
    return next(new ValidationError("Validation failed", { [HEADER]: "required" }));
  }
  if (!uuid.safeParse(key).success) {
    return next(new ValidationError("Validation failed", { [HEADER]: "invalid_format" }));
  }
  req.idempotencyKey = key.toLowerCase();
  next();
}
