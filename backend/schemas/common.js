/**
 * Schemas shared by the request validators
 */

import { z } from "zod";

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

// One title in a cart or an order: a JSON integer, never a string
export const quantity = z.number().int().min(1).max(99);
