import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { childEnv } from "../helpers/process.js";

const serverPath = fileURLToPath(new URL("../../server.js", import.meta.url));

// A working directory without a .env, so nothing but the given environment
// reaches the process
let cwd;

beforeAll(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), "bookstore-server-config-"));
});

afterAll(() => {
  fs.rmSync(cwd, { recursive: true, force: true });
});

describe("server.js with an invalid configuration", () => {
  it("prints every problem and exits 1 without starting", () => {
    // NODE_ENV=production with none of JWT_SECRET, CORS_ORIGIN, MONGODB_URI
    const result = spawnSync(process.execPath, [serverPath], {
      cwd,
      env: childEnv({ NODE_ENV: "production" }),
      encoding: "utf8",
      timeout: 15000,
    });
    const output = `${result.stdout}${result.stderr}`;

    expect({ code: result.status, signal: result.signal }, output).toEqual({
      code: 1,
      signal: null,
    });
    expect(result.stderr).toContain("JWT_SECRET");
    expect(result.stderr).toContain("CORS_ORIGIN");
    expect(result.stderr).toContain("MONGODB_URI");
    // The problems, not an uncaught error with a stack trace
    expect(result.stderr).not.toMatch(/^\s+at /m);
    expect(result.stdout).not.toContain("Server running");
  });
});
