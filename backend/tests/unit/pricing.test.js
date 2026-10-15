import { describe, expect, it } from "vitest";
import { buildQuote, toMinorUnits } from "../../services/pricing.js";

const demo = {
  currency: "CZK",
  vatRatePercent: 0,
  shippingFee: 9900,
  freeShippingThreshold: 100000,
};

const line = (lineTotal, available = true) => ({ lineTotal, available });

describe("toMinorUnits", () => {
  it.each([
    [10.99, 1099],
    [249.9, 24990],
    [329.9, 32990],
    [1.005, 101],
    [0.1 + 0.2, 30],
    [199, 19900],
    [0, 0],
  ])("turns %s into %i geller", (price, expected) => {
    expect(toMinorUnits(price)).toBe(expected);
  });
});

describe("buildQuote", () => {
  it("adds shipping below the threshold: three books at 10.99", () => {
    expect(buildQuote([line(3 * 1099)], demo)).toEqual({
      currency: "CZK",
      itemsTotal: 3297,
      shipping: 9900,
      vatIncluded: true,
      vatAmount: 0,
      total: 13197,
      freeShippingThreshold: 100000,
    });
  });

  it("ships for free from the threshold on", () => {
    const quote = buildQuote([line(60000), line(40000)], demo);

    expect(quote.itemsTotal).toBe(100000);
    expect(quote.shipping).toBe(0);
    expect(quote.total).toBe(100000);
  });

  it("charges nothing, shipping included, when no line is available", () => {
    const quote = buildQuote([line(5000, false)], demo);

    expect(quote).toMatchObject({ itemsTotal: 0, shipping: 0, total: 0, vatAmount: 0 });
  });

  it("leaves unavailable lines out of the items total", () => {
    expect(buildQuote([line(1000), line(5000, false)], demo).itemsTotal).toBe(1000);
  });

  it.each([
    [0, 0],
    [21, 2100],
    [12, Math.round((12100 * 12) / 112)],
  ])("includes %i %% VAT in a total of 12100 as %i", (vatRatePercent, vatAmount) => {
    const quote = buildQuote([line(12100)], {
      ...demo,
      vatRatePercent,
      freeShippingThreshold: 0,
    });

    expect(quote.total).toBe(12100);
    expect(quote.vatAmount).toBe(vatAmount);
  });

  it("keeps every amount whole and consistent over 500 pseudo-random carts", () => {
    // mulberry32: a small seeded generator, so a failure is reproducible
    let seed = 0x1a;
    const random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const integer = (max) => Math.floor(random() * (max + 1));

    for (let cart = 0; cart < 500; cart += 1) {
      const lines = Array.from({ length: integer(10) }, () =>
        line(integer(999999) * (1 + integer(98)), random() > 0.2)
      );
      const commerce = { ...demo, vatRatePercent: [0, 12, 21][integer(2)] };

      const quote = buildQuote(lines, commerce);

      expect(quote.itemsTotal).toBe(quote.total - quote.shipping);
      for (const key of ["itemsTotal", "shipping", "vatAmount", "total"]) {
        expect(Number.isInteger(quote[key])).toBe(true);
      }
      expect(quote.vatAmount).toBeGreaterThanOrEqual(0);
      expect(quote.vatAmount).toBeLessThanOrEqual(quote.total);
    }
  });
});
