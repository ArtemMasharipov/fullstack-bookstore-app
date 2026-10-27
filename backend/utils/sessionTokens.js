/** JWT crypto and the existing expiresIn language; no database or environment reads. */
import { createPublicKey } from "node:crypto";
import { SignJWT, decodeJwt, jwtVerify } from "jose";
import ms from "ms";

/** @typedef {{secret: string, audience: string, issuer: string, expiresIn: string|number}} TokenSettings */

function hmacKey(secret) {
  try {
    createPublicKey(secret);
  } catch {
    return new TextEncoder().encode(secret);
  }
  // Preserve the previous verifier's key-type boundary: public PEM is not an HMAC secret.
  throw new TypeError("HS256 requires a symmetric secret");
}

// jsonwebtoken treats string durations as milliseconds, integer numbers as seconds.
function expirationTime(iat, expiresIn) {
  if (typeof expiresIn === "number" && Number.isInteger(expiresIn)) return iat + expiresIn;
  if (typeof expiresIn === "string") {
    const milliseconds = ms(expiresIn);
    if (milliseconds !== undefined) return Math.floor(iat + milliseconds / 1000);
  }
  throw new TypeError("Invalid JWT expiration");
}

/** @param {{subject: string, jti: string}} identity @param {TokenSettings} settings */
export async function signSessionToken({ subject, jti }, settings) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = expirationTime(iat, settings.expiresIn);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(subject)
    .setJti(jti)
    .setAudience(settings.audience)
    .setIssuer(settings.issuer)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(hmacKey(settings.secret));
  return { token, expiresAt: new Date(exp * 1000) };
}

/** @param {string} token @param {TokenSettings} settings */
export async function verifySessionToken(token, settings) {
  const { payload } = await jwtVerify(token, hmacKey(settings.secret), {
    algorithms: ["HS256"], audience: settings.audience, issuer: settings.issuer,
    clockTolerance: 0,
  });
  return payload;
}

/** Decode only our freshly minted token for postchecks/cleanup, never authenticate input. */
export function decodeIssuedToken(token) {
  try {
    return decodeJwt(token);
  } catch {
    return null;
  }
}
