import { afterEach, describe, expect, it, vi } from "vitest";
import { childEnv } from "../helpers/process.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

const DROPPED = [
  "JWT_SECRET",
  "CORS_ORIGIN",
  "MONGODB_URI",
  "MONGODB_URL",
  "DATABASE_NAME",
  "PORT",
  "EXPOSE_ERROR_DETAILS",
  "SEED_ADMIN_PASSWORD",
];

describe("childEnv", () => {
  it("drops the app and database settings of this machine", () => {
    for (const name of DROPPED) vi.stubEnv(name, "inherited");

    const env = childEnv();

    for (const name of DROPPED) expect(env).not.toHaveProperty(name);
  });

  it("drops them whatever the case of the name (Windows ignores case)", () => {
    vi.stubEnv("mongodb_uri", "inherited");
    vi.stubEnv("Seed_Admin_Email", "inherited");

    const names = Object.keys(childEnv()).map((name) => name.toUpperCase());

    expect(names).not.toContain("MONGODB_URI");
    expect(names).not.toContain("SEED_ADMIN_EMAIL");
  });

  it("keeps every other variable", () => {
    vi.stubEnv("CHILD_ENV_KEPT", "kept");

    expect(childEnv().CHILD_ENV_KEPT).toBe("kept");
  });

  it("applies overrides after dropping, and undefined deletes a key", () => {
    vi.stubEnv("CHILD_ENV_KEPT", "kept");
    vi.stubEnv("MONGODB_URI", "inherited");

    const env = childEnv({
      MONGODB_URI: "mongodb://127.0.0.1:27017/x",
      NODE_ENV: "production",
      CHILD_ENV_KEPT: undefined,
    });

    expect(env.MONGODB_URI).toBe("mongodb://127.0.0.1:27017/x");
    expect(env.NODE_ENV).toBe("production");
    expect(env).not.toHaveProperty("CHILD_ENV_KEPT");
  });

  it("does not change process.env", () => {
    vi.stubEnv("MONGODB_URI", "inherited");

    childEnv({ CHILD_ENV_NEW: "1" });

    expect(process.env.MONGODB_URI).toBe("inherited");
    expect(process.env).not.toHaveProperty("CHILD_ENV_NEW");
  });
});
