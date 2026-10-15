/**
 * Config Routes
 * The shop settings the client shows: currency, VAT, shipping. Public.
 */

import express from "express";
import { config } from "../config/index.js";
import { ok } from "../utils/respond.js";

const router = express.Router();

/**
 * @route   GET /api/v1/config/public
 * @desc    Shop settings for texts about prices and shipping
 * @access  Public
 */
router.get("/public", (req, res) => {
  const { currency, vatRatePercent, shippingFee, freeShippingThreshold } =
    config.commerce;

  ok(res, {
    currency,
    vatIncluded: true,
    vatRatePercent,
    shippingFee,
    freeShippingThreshold,
    // Online payment comes with its own stage; until then there is none
    paymentMethods: [],
  });
});

export default router;
