import bcrypt from "bcrypt";
import { describe, expect, it, vi } from "vitest";
import * as passwords from "../../utils/passwords.js";

const BCRYPT5_HASH = "$2b$10$MPbgVxQ8zfl/WU2Q6GCTJOaN7G3JmLurBXQ9jN08fiqIpmpHXTnyy";

describe("password hashing and verification", () => {
  it("initializes one dummy credential when cold requests overlap", async () => {
    const hash = vi.spyOn(bcrypt, "hash");
    try {
      expect(await Promise.all(Array.from({ length: 4 }, () => passwords.verifyAgainstDummy("wrong"))))
        .toEqual([false, false, false, false]);
      expect(hash).toHaveBeenCalledTimes(1);
    } finally {
      hash.mockRestore();
    }
  });

  it("stores interoperable Argon2id PHC with random 16-byte salts and 32-byte tags", async () => {
    const first = await passwords.hashPassword("Cedar lantern 47!");
    const second = await passwords.hashPassword("Cedar lantern 47!");
    expect(first).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]{22}\$[A-Za-z0-9+/]{43}$/);
    expect(first).not.toBe(second);
    expect(Buffer.from(first.split("$")[4], "base64")).toHaveLength(16);
    expect(Buffer.from(first.split("$")[5], "base64")).toHaveLength(32);
    expect(await passwords.verifyPassword("Cedar lantern 47!", first)).toBe(true);
    expect(await passwords.verifyPassword("Cedar lantern 48!", first)).toBe(false);
  });

  it("normalizes Argon2id input with NFKC without trimming spaces", async () => {
    const hash = await passwords.hashPassword("  Ｃafe\u0301 lantern 47!  ");
    expect(await passwords.verifyPassword("  Café lantern 47!  ", hash)).toBe(true);
    expect(await passwords.verifyPassword("Café lantern 47!", hash)).toBe(false);
  });

  it("verifies legacy bcrypt by the original input", async () => {
    expect(await passwords.verifyPassword("secret123", BCRYPT5_HASH)).toBe(true);
    expect(await passwords.verifyPassword("secret124", BCRYPT5_HASH)).toBe(false);
    const raw = "Ｃafe\u0301 lantern 47!";
    const legacy = await bcrypt.hash(raw, 10);
    expect(await passwords.verifyPassword(raw, legacy)).toBe(true);
    expect(await passwords.verifyPassword(raw.normalize("NFKC"), legacy)).toBe(false);
    expect(passwords.needsPasswordRehash(BCRYPT5_HASH)).toBe(true);
    expect(passwords.needsPasswordRehash(await passwords.hashPassword(raw))).toBe(false);
  });

  it("verifies the tail after 72 bytes, including long Unicode passwords", async () => {
    const hash = await passwords.hashPassword("a".repeat(72) + "x");
    expect(await passwords.verifyPassword("a".repeat(72) + "x", hash)).toBe(true);
    expect(await passwords.verifyPassword("a".repeat(72) + "y", hash)).toBe(false);
    const unicode = "🙂".repeat(64);
    expect(await passwords.verifyPassword(unicode, await passwords.hashPassword(unicode))).toBe(true);
  });

  it.each([
    "",
    "not-a-hash",
    "$argon2id$v=16$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(43),
    "$argon2id$v=19$m=19457,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(43),
    "$argon2id$v=19$m=19456,t=2,p=2$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(43),
    "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(43),
    "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAB$" + "A".repeat(43),
    "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$short",
  ])("rejects unsupported or malformed stored credentials: %s", async (hash) => {
    expect(await passwords.verifyPassword("Cedar lantern 47!", hash)).toBe(false);
  });

  it("uses the uniform login verifier for both supported hash formats and unknown accounts", async () => {
    const modern = await passwords.hashPassword("Cedar lantern 47!");
    expect(await passwords.verifyLoginPassword("Cedar lantern 47!", modern)).toBe(true);
    expect(await passwords.verifyLoginPassword("secret123", BCRYPT5_HASH)).toBe(true);
    expect(await passwords.verifyLoginPassword("wrong", modern)).toBe(false);
    expect(await passwords.verifyLoginPassword("wrong", BCRYPT5_HASH)).toBe(false);
    expect(await passwords.verifyLoginPassword("wrong")).toBe(false);
  });
});
