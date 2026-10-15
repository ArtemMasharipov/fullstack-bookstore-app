/**
 * Pricing
 * Money on the server is whole geller (1/100 CZK). Book prices are still
 * stored in crowns as floats, so they are converted once, here.
 */

/**
 * A stored price in crowns as geller. toPrecision(12) drops the float noise
 * of the multiplication (1.005 * 100 is 100.49999999999999), so the one
 * rounding sees the decimal value the price was entered with.
 */
export function toMinorUnits(price) {
  return Math.round(Number((price * 100).toPrecision(12)));
}

/**
 * The quote of a cart: lines that are not available do not count, shipping is
 * free from the threshold on and when nothing is ordered, and VAT is part of
 * the total (prices include it), never added on top.
 */
export function buildQuote(lines, commerce) {
  const available = lines.filter((line) => line.available);
  const itemsTotal = available.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping =
    available.length === 0 || itemsTotal >= commerce.freeShippingThreshold
      ? 0
      : commerce.shippingFee;
  const total = itemsTotal + shipping;
  const rate = commerce.vatRatePercent;

  return {
    currency: commerce.currency,
    itemsTotal,
    shipping,
    vatIncluded: true,
    vatAmount: Math.round((total * rate) / (100 + rate)),
    total,
    freeShippingThreshold: commerce.freeShippingThreshold,
  };
}
