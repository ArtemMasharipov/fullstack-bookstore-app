import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { childEnv } from "../helpers/process.js";

// REQ-0-09: the e2e server (npm run e2e:server) starts its own in-memory
// MongoDB and never connects to the one named by MONGODB_URI. Every case runs
// it in a child process.
const e2eServerPath = fileURLToPath(
  new URL("../../scripts/e2e-server.js", import.meta.url)
);

// What a developer's backend/.env could name: the server must not reach it
const REMOTE_URI = "mongodb://remote.example/x";

// A working directory without a .env, so nothing but the given environment
// reaches the process
let cwd;
const started = [];

beforeAll(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), "bookstore-e2e-server-"));
});

afterAll(async () => {
  for (const running of started) await stopE2eServer(running);
  // Windows cannot remove the directory while a process still uses it. A server
  // killed by the fallback leaves its mongod and the helper that stops it (it
  // checks every 2 s, see mongodb-memory-server's mongo_killer.js), so wait for
  // those too.
  fs.rmSync(cwd, {
    recursive: true,
    force: true,
    maxRetries: 20,
    retryDelay: 250,
  });
});

// Starts e2e-server.js on a random port, with an IPC channel for the stop (see
// stopE2eServer). `closed` settles after the process has exited and its output
// was read.
function startE2eServer({ nodeArgs = [] } = {}) {
  const child = spawn(process.execPath, [...nodeArgs, e2eServerPath], {
    cwd,
    env: childEnv({
      MONGODB_URI: REMOTE_URI,
      E2E_API_PORT: "0",
      SEED_ADMIN_PASSWORD: "e2e-admin-pass",
      SEED_USER_PASSWORD: "e2e-user-pass",
    }),
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  const output = { stdout: "", stderr: "" };
  child.stdout.setEncoding("utf8").on("data", (text) => {
    output.stdout += text;
  });
  child.stderr.setEncoding("utf8").on("data", (text) => {
    output.stderr += text;
  });
  // Not the "close" event: Node never emits it for a child whose IPC channel
  // was ended by this side, as stopE2eServer does
  const closed = Promise.all([
    new Promise((resolve) => {
      child.once("exit", (code, signal) => resolve({ code, signal }));
    }),
    new Promise((resolve) => child.stdout.once("close", resolve)),
    new Promise((resolve) => child.stderr.once("close", resolve)),
  ]).then(([exit]) => exit);

  const running = { child, output, closed };
  started.push(running);
  return running;
}

// The graceful stop, on every OS (Windows never calls a SIGTERM handler): the
// end of the IPC channel. The server then stops its mongod and removes the
// data directory. A hard kill leaves the directory behind, so it is only the
// fallback for a server that does not exit in time.
async function stopE2eServer({ child, closed }) {
  if (child.connected) child.disconnect();
  const fallback = setTimeout(() => child.kill(), 15000);
  try {
    return await closed;
  } finally {
    clearTimeout(fallback);
  }
}

const untilListening = async ({ output }) => {
  await vi.waitFor(
    () => expect(output.stdout).toMatch(/E2E API listening on \d+/),
    { timeout: 50000, interval: 50 }
  );
  return Number(/E2E API listening on (\d+)/.exec(output.stdout)[1]);
};

// The data directory of the server's MongoDB, which it prints at startup
const dbPathOf = ({ output }) => {
  const match = /^mongo dbPath (.+)$/m.exec(output.stdout);
  expect(match, output.stdout + output.stderr).not.toBeNull();
  return match[1];
};

describe("e2e-server.js", () => {
  let running;
  let port;

  beforeAll(async () => {
    running = startE2eServer();
    port = await untilListening(running);
  });

  it("connects to its own in-memory MongoDB, not to MONGODB_URI", () => {
    expect(running.output.stdout).toContain("mongo host 127.0.0.1");
    expect(running.output.stdout + running.output.stderr).not.toContain(
      "remote.example"
    );
  });

  it("serves a catalogue seeded with the 24 demo books", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/books`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.pagination.total).toBe(24);
  });

  // Node on Windows never calls a SIGTERM handler, so this runs on Linux (CI,
  // or Docker locally) and is skipped on Windows. Playwright's gracefulShutdown
  // stops the server this way on Linux and macOS.
  it.skipIf(process.platform === "win32")(
    "exits 0 after SIGTERM, with the data directory of its MongoDB removed",
    async () => {
      const dbPath = dbPathOf(running);
      running.child.kill("SIGTERM");

      const { code, signal } = await running.closed;

      expect(
        { code, signal },
        running.output.stdout + running.output.stderr
      ).toEqual({ code: 0, signal: null });
      expect(fs.existsSync(dbPath)).toBe(false);
    }
  );
});

describe("e2e-server.js: a graceful stop", () => {
  it("follows the end of its IPC channel: exit 0, and the data directory of its MongoDB is removed", async () => {
    const running = startE2eServer();
    await untilListening(running);
    const dbPath = dbPathOf(running);
    expect(fs.existsSync(dbPath)).toBe(true);

    const { code, signal } = await stopE2eServer(running);

    expect(
      { code, signal },
      running.output.stdout + running.output.stderr
    ).toEqual({ code: 0, signal: null });
    expect(fs.existsSync(dbPath)).toBe(false);
  });
});

describe("e2e-server.js: the connected host", () => {
  it("is checked after connecting: a host that is not local ends the process with 1 and nothing is served", async () => {
    // The in-memory server is local, but the connection reports a remote host
    // (what the guard after connecting is for). mongoose assigns host itself
    // while it connects, hence the empty setter.
    const mongooseUrl = pathToFileURL(
      createRequire(import.meta.url).resolve("mongoose")
    ).href;
    const pretendRemote = [
      "--import",
      "data:text/javascript," +
        encodeURIComponent(
          `import mongoose from ${JSON.stringify(mongooseUrl)};\n` +
            "Object.defineProperty(mongoose.connection, 'host', {\n" +
            "  get: () => 'db.example.com',\n" +
            "  set: () => {},\n" +
            "});"
        ),
    ];

    const { output, closed } = startE2eServer({ nodeArgs: pretendRemote });

    // It ends on its own: after the refusal it stops what it started
    const { code } = await closed;
    expect(code, output.stdout + output.stderr).toBe(1);
    expect(output.stderr).toContain("non-local MongoDB");
    expect(output.stdout + output.stderr).not.toContain("db.example.com");
    expect(output.stdout).not.toContain("E2E API listening");
  });
});
