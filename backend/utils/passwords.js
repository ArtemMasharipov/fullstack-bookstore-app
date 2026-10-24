/** Native Argon2id storage, raw legacy bcrypt checks and uniform login work. */
import { argon2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import bcrypt from "bcrypt";

const derive = promisify(argon2);
const PARAMETERS = Object.freeze({ memory: 19456, passes: 2, parallelism: 1, tagLength: 32 });
const PREFIX = "$argon2id$v=19$m=19456,t=2,p=1$";
const PHC = /^\$argon2id\$v=19\$m=19456,t=2,p=1\$([A-Za-z0-9+/]{22})\$([A-Za-z0-9+/]{43})$/;
const BCRYPT = /^\$2[ab]\$(?:0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/;
const base64 = (bytes) => bytes.toString("base64").replace(/=+$/, "");

// Only the bounded format this application writes may control native KDF work.
function parseArgon(hash) {
  if (typeof hash !== "string") return null;
  const match = PHC.exec(hash);
  if (!match) return null;
  const salt = Buffer.from(match[1], "base64");
  const tag = Buffer.from(match[2], "base64");
  if (salt.length !== 16 || tag.length !== 32 || base64(salt) !== match[1] || base64(tag) !== match[2]) return null;
  return { salt, tag };
}

export async function hashPassword(input) {
  const salt = randomBytes(16);
  const tag = await derive("argon2id", { ...PARAMETERS, message: input.normalize("NFKC"), nonce: salt });
  return PREFIX + base64(salt) + "$" + base64(tag);
}

export function needsPasswordRehash(hash) {
  return typeof hash === "string" && BCRYPT.test(hash);
}

export async function verifyPassword(input, hash) {
  if (typeof input !== "string") return false;
  if (needsPasswordRehash(hash)) return bcrypt.compare(input, hash);
  const parsed = parseArgon(hash);
  if (!parsed) return false;
  const actual = await derive("argon2id", { ...PARAMETERS, message: input.normalize("NFKC"), nonce: parsed.salt });
  return timingSafeEqual(actual, parsed.tag);
}

let dummyPromise;
function dummyCredentials() {
  // Cache the promise itself: concurrent first requests must share initialization.
  return dummyPromise ??= Promise.all([
    hashPassword(randomBytes(32).toString("base64url")),
    bcrypt.hash(randomBytes(32).toString("base64url"), 10),
  ]).then(([modern, legacy]) => ({ modern, legacy }));
}

export async function verifyLoginPassword(input, hash) {
  const dummy = await dummyCredentials();
  const modern = Boolean(parseArgon(hash));
  const legacy = needsPasswordRehash(hash);
  // Every attempt performs both formats, in this order. This also hides the
  // stored format while old accounts are migrating from bcrypt cost 10.
  const modernMatches = await verifyPassword(input, modern ? hash : dummy.modern);
  const legacyMatches = await verifyPassword(input, legacy ? hash : dummy.legacy);
  return modern ? modernMatches : legacy ? legacyMatches : false;
}

export function verifyAgainstDummy(input) {
  return verifyLoginPassword(input);
}
