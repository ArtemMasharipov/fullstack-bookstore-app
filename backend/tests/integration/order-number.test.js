import { describe, expect, it } from "vitest";
import { nextOrderNumber } from "../../services/orderNumber.js";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();

describe("nextOrderNumber", () => {
  it("numbers follow ORD-YYYYMMDD-NNNNNN in UTC", async () => {
    expect(await nextOrderNumber(new Date("2026-10-15T23:59:59.999Z"))).toBe("ORD-20261015-000001");
    expect(await nextOrderNumber(new Date("2026-10-15T08:00:00.000Z"))).toBe("ORD-20261015-000002");
    expect(await nextOrderNumber(new Date("2026-10-16T00:00:00.000Z"))).toBe("ORD-20261016-000001");
  });

  it("twenty parallel numbers are unique and consecutive", async () => {
    const day = new Date("2026-10-15T12:00:00.000Z");

    const numbers = await Promise.all(Array.from({ length: 20 }, () => nextOrderNumber(day)));
    const expected = Array.from(
      { length: 20 },
      (_, i) => `ORD-20261015-${String(i + 1).padStart(6, "0")}`
    );

    expect([...numbers].sort()).toEqual(expected);
  });
});
