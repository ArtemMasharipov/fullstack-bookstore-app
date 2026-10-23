import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../app.js";
import User from "../../models/User.js";
import { createUser } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

// Stored passwords must keep working across bcrypt upgrades. This hash of
// "secret123" was made by bcrypt 5.1.1 and must never be regenerated.
const BCRYPT5_HASH = "$2b$10$MPbgVxQ8zfl/WU2Q6GCTJOaN7G3JmLurBXQ9jN08fiqIpmpHXTnyy";

useTestDatabase();

const login = (email, password) =>
  request(app).post("/api/v1/auth/login").send({ emailOrUsername: email, password });

describe("password hashes", () => {
  it("signs in with a password hashed by bcrypt 5", async () => {
    const user = await createUser();
    // updateOne skips the pre-save hook, so the stored hash stays as it is.
    await User.updateOne({ _id: user._id }, { $set: { password: BCRYPT5_HASH } });

    const ok = await login(user.email, "secret123");
    expect(ok.status).toBe(200);
    expect(ok.body.data.token).toEqual(expect.any(String));

    const wrong = await login(user.email, "secret124");
    expect(wrong.status).toBe(401);
  });

  it("stores a new password as an Argon2id PHC credential", async () => {
    const user = await createUser();

    const stored = await User.findById(user._id).select("+password");

    expect(stored.password).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(await stored.comparePassword("secret123")).toBe(true);
  });

  it("does not accept a different password with the same first 72 bytes", async () => {
    const user = await createUser({ password: "a".repeat(72) + "x" });
    expect((await login(user.email, "a".repeat(72) + "y")).status).toBe(401);
    expect((await login(user.email, "a".repeat(72) + "x")).status).toBe(200);
  });

  it("treats hash-looking plaintext as a password, not as a pre-hashed credential", async () => {
    const user = await createUser({ password: BCRYPT5_HASH });
    const stored = await User.findById(user._id).select("+password");
    expect(stored.password).not.toBe(BCRYPT5_HASH);
    expect(await stored.comparePassword(BCRYPT5_HASH)).toBe(true);
    expect(await stored.comparePassword("secret123")).toBe(false);
  });
});
