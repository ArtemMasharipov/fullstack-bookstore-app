import { describe, expect, it } from "vitest";
import User from "../../models/User.js";
import { useTestDatabase } from "../helpers/db.js";

// Same content as db-isolation.a.test.js: both files create the same unique
// user, so a database shared by parallel workers would make them collide.
useTestDatabase();

describe("test database isolation", () => {
  it("sees only its own data", async () => {
    await User.create({
      username: "isolation",
      email: "isolation@example.com",
      password: "secret123",
    });

    expect(await User.countDocuments()).toBe(1);
  });
});
