import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { childEnv } from "../helpers/process.js";

// load-env.js reads .env from the working directory, so each case runs it in a
// child process whose cwd holds a .env with a "remote" database URI.
const loadEnvUrl = new URL("../../config/load-env.js", import.meta.url).href;
const script =
  `await import(${JSON.stringify(loadEnvUrl)}); ` +
  `console.log(process.env.MONGODB_URI ?? "unset")`;

let dir;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "bookstore-load-env-"));
  fs.writeFileSync(
    path.join(dir, ".env"),
    "MONGODB_URI=mongodb://remote.example/x\n"
  );
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

// MONGODB_URI the child sees after importing load-env.js with this NODE_ENV
const mongodbUriWith = (nodeEnv) =>
  execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: dir,
    env: childEnv({ NODE_ENV: nodeEnv }),
    encoding: "utf8",
  }).trim();

describe("config/load-env.js", () => {
  it("does not read .env when NODE_ENV is test", () => {
    expect(mongodbUriWith("test")).toBe("unset");
  });

  it.each(["development", "production", undefined])(
    "reads .env when NODE_ENV is %s",
    (nodeEnv) => {
      expect(mongodbUriWith(nodeEnv)).toBe("mongodb://remote.example/x");
    }
  );
});
