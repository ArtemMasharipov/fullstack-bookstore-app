/**
 * Order request schemas
 */

import { z } from "zod";
import { objectId } from "./common.js";

export const orderIdParams = z.strictObject({ id: objectId });

// Query values arrive as strings; anything that is not a whole number fails
export const listOrdersQuery = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// Trimmed first; then the length and no control characters (line breaks, NUL)
const text = (min, max) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .regex(/^[^\p{Cc}]*$/u);

// The shop delivers only within the Czech Republic
export const shippingAddressSchema = z.strictObject({
  fullName: text(2, 100),
  line1: text(3, 200),
  city: text(2, 100),
  postalCode: z.string().trim().regex(/^\d{3} ?\d{2}$/),
  country: z.literal("CZ"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+420)? ?\d{3} ?\d{3} ?\d{3}$/),
});

// expectedTotal is the total the customer saw, in geller
export const createOrderBody = z.strictObject({
  shippingAddress: shippingAddressSchema,
  expectedTotal: z.number().int().min(0),
});
