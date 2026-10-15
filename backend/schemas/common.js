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
