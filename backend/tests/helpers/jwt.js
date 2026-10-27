/** Independent legacy-format JWT fixtures: no production adapter or JWT library. */
import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "node:crypto";

const hashes = { HS256: "sha256", HS512: "sha512" };
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

export function signLegacyToken(claims, { secret, algorithm = "HS256", header = {} }) {
  const input = `${encode({ alg: algorithm, typ: "JWT", ...header })}.${encode(claims)}`;
  if (algorithm === "none") return `${input}.`;
  assert(hashes[algorithm], "Unsupported fixture algorithm");
  return `${input}.${createHmac(hashes[algorithm], secret).update(input).digest("base64url")}`;
}

export function decodeJwtFixture(token) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
}

export function verifyJwtFixture(token, secret) {
  const [protectedHeader, body, signature, extra] = token.split(".");
  assert.equal(extra, undefined);
  const header = JSON.parse(Buffer.from(protectedHeader, "base64url").toString("utf8"));
  assert(hashes[header.alg], "Expected an HMAC fixture");
  const expected = createHmac(hashes[header.alg], secret).update(`${protectedHeader}.${body}`).digest();
  const actual = Buffer.from(signature, "base64url");
  assert.equal(actual.length, expected.length);
  assert(timingSafeEqual(actual, expected), "Invalid JWT signature");
  return { header, payload: decodeJwtFixture(token) };
}
