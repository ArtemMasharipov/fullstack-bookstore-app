/**
 * Schemas shared by the request validators
 */

import { z } from "zod";

// Lower-cased, the way MongoDB prints ids: the services compare ids as strings
export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .transform((id) => id.toLowerCase());

// One title in a cart or an order: a JSON integer, never a string
export const quantity = z.number().int().min(1).max(99);

// Query values arrive as strings; anything that is not a whole number fails
export const page = z.coerce.number().int().min(1).default(1);

export const limit = (max, fallback) => z.coerce.number().int().min(1).max(max).default(fallback);

// A sort key from a fixed list: "-" in front sorts in descending order
export const sortBy = (values, fallback) => z.enum(values).default(fallback);

// A single string value: a repeated parameter (an array) or a bracket key (an object) fails
export const text = (max) => z.string().trim().min(1).max(max);
