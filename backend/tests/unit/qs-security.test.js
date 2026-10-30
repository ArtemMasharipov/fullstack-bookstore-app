import qs from "qs";
import { describe, expect, it } from "vitest";

const hostileJson = () => JSON.parse('{"a":[{"toString":"x"}]}');

const regressionCases = [
  ["JSON array entries", hostileJson, { arrayFormat: "comma" }, "a=%5Bobject%20Object%5D"],
  [
    "JSON entries with encodeValuesOnly",
    hostileJson,
    { arrayFormat: "comma", encodeValuesOnly: true },
    "a=%5Bobject%20Object%5D",
  ],
  [
    "parsed entries with allowPrototypes",
    () => qs.parse("a[0][toString]=x", { allowPrototypes: true }),
    { arrayFormat: "comma" },
    "a=%5Bobject%20Object%5D",
  ],
  [
    "null-prototype entries",
    () => qs.parse("a[][b]=c", { plainObjects: true }),
    { arrayFormat: "comma" },
    "a=%5Bobject%20Object%5D",
  ],
  [
    "nested array entries",
    () => JSON.parse('{"a":[[1,[{"toString":"x"}]],"y"]}'),
    { arrayFormat: "comma", encode: false },
    "a=1,[object Object],y",
  ],
];

describe("qs comma serialization security", () => {
  it.each(regressionCases)(
    "serializes %s without a coercion crash",
    (_name, makeInput, options, expected) => {
      expect(qs.stringify(makeInput(), options)).toBe(expected);
    }
  );

  it("preserves indexed serialization of an own toString property", () => {
    expect(qs.stringify(hostileJson())).toBe("a%5B0%5D%5BtoString%5D=x");
  });

  it("preserves scalar comma encoding", () => {
    expect(qs.stringify({ a: ["x", "y"] }, { arrayFormat: "comma" })).toBe("a=x%2Cy");
  });

  it("preserves callable toString output", () => {
    const value = { toString: () => "z" };
    expect(qs.stringify({ a: [value] }, { arrayFormat: "comma" })).toBe("a=z");
  });

  it("preserves a primitive valueOf result", () => {
    const value = { toString: "x", valueOf: () => 7 };
    expect(qs.stringify({ a: [value] }, { arrayFormat: "comma" })).toBe("a=7");
  });

  it.each(["toString", "valueOf"])("propagates exceptions from a custom %s", (hook) => {
    const sentinel = hook === "toString"
      ? new SyntaxError("custom toString failure")
      : new EvalError("custom valueOf failure");
    const value = hook === "toString"
      ? { toString: () => { throw sentinel; } }
      : { toString: "x", valueOf: () => { throw sentinel; } };
    let caught;
    try {
      qs.stringify({ a: [value] }, { arrayFormat: "comma" });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBe(sentinel);
  });
});
