/**
 * Order request schemas
 */

import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../models/Order.js";
import { limit, objectId, page } from "./common.js";

export const orderIdParams = z.strictObject({ id: objectId });

export const listOrdersQuery = z.strictObject({
  page,
  limit: limit(50, 10),
});

export const adminListOrdersQuery = z.strictObject({
  page,
  limit: limit(100, 20),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
});

export const orderStatusBody = z.strictObject({ status: z.enum(ORDER_STATUSES) });
export const orderPaymentBody = z.strictObject({ paymentStatus: z.enum(["paid", "refunded"]) });
export const emptyOrderQuery = z.strictObject({});

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
