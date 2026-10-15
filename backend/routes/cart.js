/**
 * Cart Routes
 * Defines shopping cart endpoints
 */

import express from "express";
import * as cartController from "../controllers/cartController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  addItemBody,
  bookIdParams,
  cartItemsBody,
  setQuantityBody,
} from "../schemas/cart.js";

const router = express.Router();

// Public: prices a guest cart without storing it
router.post(
  "/quote",
  validate({ body: cartItemsBody }),
  asyncHandler(cartController.quote)
);

// Everything below requires authentication
router.use(protect);

router.get("/", asyncHandler(cartController.getCart));

router.post(
  "/",
  validate({ body: addItemBody }),
  asyncHandler(cartController.addItem)
);

router.put(
  "/:bookId",
  validate({ params: bookIdParams, body: setQuantityBody }),
  asyncHandler(cartController.setItemQuantity)
);

router.delete(
  "/:bookId",
  validate({ params: bookIdParams }),
  asyncHandler(cartController.removeItem)
);

router.delete("/", asyncHandler(cartController.clearCart));

export default router;
