/**
 * Request schemas of the cart endpoints
 */

import { z } from "zod";
import { objectId, quantity } from "./common.js";

export const bookIdParams = z.strictObject({ bookId: objectId });

export const addItemBody = z.strictObject({
  bookId: objectId,
  quantity: quantity.default(1),
});

export const setQuantityBody = z.strictObject({ quantity });

// A guest cart: priced by /cart/quote, merged by /cart/merge
export const cartItemsBody = z.strictObject({
  items: z.array(z.strictObject({ bookId: objectId, quantity })).max(50),
});
