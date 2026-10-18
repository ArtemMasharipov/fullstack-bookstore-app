/**
 * Password checks
 * verifyAgainstDummy() spends the time of a real check when there is no
 * account, so the time of a sign-in does not tell whether the account exists.
 */

import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";

// The cost the User model hashes with
const COST = 10;

let dummyHash;

/**
 * @param {string} password
 * @param {string} hash - A stored bcrypt hash
 * @returns {Promise<boolean>}
 */
export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Checks the password against a hash nobody's password matches
 * @returns {Promise<false>}
 */
export async function verifyAgainstDummy(password) {
  dummyHash ??= await bcrypt.hash(randomBytes(16).toString("hex"), COST);
  await bcrypt.compare(password, dummyHash);
  return false;
}
