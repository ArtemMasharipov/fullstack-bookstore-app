import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { childEnv } from "../helpers/process.js";

// app.js decides from NODE_ENV when it is imported, so each case imports it in
// a child process, sends one request with a query string and returns what the
// process printed.
const appUrl = new URL("../../app.js", import.meta.url).href;
const script = `
  import http from "node:http";
  const { default: app } = await import(${JSON.stringify(appUrl)});
  const server = http.createServer(app).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  await fetch(\`http://127.0.0.1:\${server.address().port}/api/v1/health?token=abc\`);
  process.exit(0);
`;

let dir;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "bookstore-app-logging-"));
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const outputWith = (nodeEnv) =>
  execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: dir,
    env: childEnv({
      NODE_ENV: nodeEnv,
      JWT_SECRET: "app-logging-test-secret-0123456789abcdef0123456789",
    }),
    encoding: "utf8",
  });

describe("request logging in app.js", () => {
  it("logs method, path, status and duration, without the query, outside test", () => {
    const output = outputWith("development");

    expect(output).toMatch(/^GET \/api\/v1\/health 200 \d+ms$/m);
    expect(output).not.toContain("token=abc");
  });

  it("logs nothing when NODE_ENV is test", () => {
    expect(outputWith("test")).not.toContain("/api/v1/health");
  });
});
