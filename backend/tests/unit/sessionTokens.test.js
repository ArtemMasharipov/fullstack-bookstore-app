import { generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodeIssuedToken, signSessionToken, verifySessionToken } from "../../utils/sessionTokens.js";
import { signLegacyToken, verifyJwtFixture } from "../helpers/jwt.js";

const settings = { secret: "unicode-test-ключ", audience: "test-web", issuer: "test-api", expiresIn: "7d" };
const identity = { subject: "0123456789abcdef01234567", jti: "test-session" };
const claims = {
  sub: "0123456789abcdef01234567", jti: "test-session", aud: "test-web", iss: "test-api",
  iat: 1793102400, exp: 1793106000,
};
const keys = generateKeyPairSync("ed25519", {
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-27T12:00:00.500Z"));
});

describe("session token verification", () => {
  it.each(["unicode-test-ключ", "x", "BEGIN is ordinary test text"])("accepts ordinary UTF-8 secret %j", async secret => {
    const token = signLegacyToken(claims, { secret });
    expect(await verifySessionToken(token, { ...settings, secret })).toEqual(claims);
    const issued = await signSessionToken(identity, { ...settings, secret });
    expect(verifyJwtFixture(issued.token, secret).payload.sub).toBe("0123456789abcdef01234567");
  });

  it.each([
    ["wrong key", claims, { secret: "another-test-key" }],
    ["HS512", claims, { algorithm: "HS512" }],
    ["none", claims, { algorithm: "none" }],
    ["expired at this second", { ...claims, exp: 1793102400 }, {}],
    ["future nbf", { ...claims, nbf: 1793102401 }, {}],
    ["malformed iat", { ...claims, iat: "yesterday" }, {}],
    ["unknown critical header", claims, { header: { crit: ["unknown"], unknown: true } }],
  ])("rejects %s", async (name, payload, options) => {
    const token = signLegacyToken(payload, { secret: settings.secret, ...options });
    await expect(verifySessionToken(token, settings)).rejects.toThrow();
  });

  it.each(["publicKey", "privateKey"])("rejects asymmetric %s material for HMAC", async kind => {
    const secret = keys[kind];
    await expect(signSessionToken(identity, { ...settings, secret })).rejects.toThrow();
    const forged = signLegacyToken(claims, { secret });
    await expect(verifySessionToken(forged, { ...settings, secret })).rejects.toThrow();
  });

  it.each(["0s", "-1.5s"])("does not turn expired TTL %s into a valid session token", async expiresIn => {
    const issued = await signSessionToken(identity, { ...settings, expiresIn });
    await expect(verifySessionToken(issued.token, settings)).rejects.toThrow();
  });
});

describe("own issued token decoding", () => {
  it("reads claims without using decode as signature verification", () => {
    const token = signLegacyToken(claims, { secret: "unrelated-test-key" });
    expect(decodeIssuedToken(token)).toEqual(claims);
  });

  it.each(["not-a-token", "e30.bm90LWpzb24.sig", null])("returns null for malformed input %j", token => {
    expect(decodeIssuedToken(token)).toBeNull();
  });
});
afterEach(() => vi.useRealTimers());

describe("session token signing", () => {
  it("signs interoperable HS256 with exact claims and expiry", async () => {
    const issued = await signSessionToken(identity, settings);
    expect(issued).toEqual({ token: expect.any(String), expiresAt: expect.any(Date) });
    const { header, payload } = verifyJwtFixture(issued.token, settings.secret);
    expect(header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(payload).toEqual({
      sub: "0123456789abcdef01234567", jti: "test-session",
      aud: "test-web", iss: "test-api", iat: 1793102400, exp: 1793707200,
    });
    expect(issued.expiresAt.getTime()).toBe(1793707200000);
  });

  it.each([
    ["7d", 604800], ["120", 0], ["1000", 1], ["1.5s", 1], ["-1.5s", -2],
    ["0s", 0], [120, 120], ["1.5 hours", 5400], ["2 DAYS", 172800],
  ])("preserves expiresIn semantics for %j", async (expiresIn, seconds) => {
    const issued = await signSessionToken(identity, { ...settings, expiresIn });
    expect(issued?.token).toEqual(expect.any(String));
    const { payload } = verifyJwtFixture(issued.token, settings.secret);
    expect(payload.exp).toBe(1793102400 + seconds);
    expect(issued.expiresAt.getTime()).toBe((1793102400 + seconds) * 1000);
  });

  it.each(["nonsense", "1".repeat(101), 1.5])("rejects invalid expiresIn %j", async expiresIn => {
    await expect(signSessionToken(identity, { ...settings, expiresIn })).rejects.toThrow();
  });
});
