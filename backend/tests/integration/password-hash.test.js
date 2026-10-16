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

  it("stores a new password as a $2b$ hash of cost 10", async () => {
    const user = await createUser();

    const stored = await User.findById(user._id).select("+password");

    expect(stored.password).toMatch(/^\$2b\$10\$/);
  });
});
