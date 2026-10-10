import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, inject, it, vi } from "vitest";
import { childEnv } from "../helpers/process.js";

const serverPath = fileURLToPath(new URL("../../server.js", import.meta.url));

const occurrences = (text, part) => text.split(part).length - 1;

let cwd;
let server;
const tcpServers = new Set();
const sockets = new Set();

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), "bookstore-lifecycle-"));
});

afterEach(async () => {
  const child = server?.child;
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    // Windows cannot remove the directory while the process still uses it
    await server.closed;
  }
  server = undefined;
  for (const socket of sockets) socket.destroy();
  sockets.clear();
  for (const tcp of tcpServers) tcp.close();
  tcpServers.clear();
  fs.rmSync(cwd, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

const JWT_SECRET = "lifecycle-test-secret-0123456789abcdef0123456789";

// Settings for a server.js that must not read .env: an in-memory database
// (or the given URI) and a random port (or the given one)
const testEnv = ({
  mongodbUri = `${inject("mongoUri")}lifecycle`,
  port = 0,
} = {}) => ({
  NODE_ENV: "test",
  MONGODB_URI: mongodbUri,
  JWT_SECRET,
  PORT: String(port),
});

// Starts server.js in the temp cwd with the given environment overrides.
// `closed` settles after the process has exited and its output was read.
function startServer(env = testEnv()) {
  const child = spawn(process.execPath, [serverPath], {
    cwd,
    env: childEnv(env),
  });

  const output = { stdout: "", stderr: "" };
  child.stdout.setEncoding("utf8").on("data", (text) => {
    output.stdout += text;
  });
  child.stderr.setEncoding("utf8").on("data", (text) => {
    output.stderr += text;
  });
  const closed = new Promise((resolve) => {
    child.once("close", (code, signal) => resolve({ code, signal }));
  });

  server = { child, output, closed };
  return server;
}

// A TCP server on a random port (all interfaces unless host is given),
// closed after the test
async function listenTcp({ host, onConnection } = {}) {
  const tcp = net.createServer(onConnection);
  tcpServers.add(tcp);
  await new Promise((resolve) => tcp.listen(0, host, resolve));
  return tcp;
}

async function freePort() {
  const tcp = await listenTcp();
  const { port } = tcp.address();
  await new Promise((resolve) => tcp.close(resolve));
  return port;
}

// Opens a connection with a request that never completes: server.close() keeps
// waiting for it. The pause lets the server read the partial request first.
async function holdRequestOpen(port) {
  const client = net.connect(port, "127.0.0.1");
  sockets.add(client);
  await new Promise((resolve) => client.once("connect", resolve));
  client.write("GET /api/v1/health HTTP/1.1\r\nHost: localhost\r\n");
  await sleep(200);
  return client;
}

const untilOutput = ({ output }, text) =>
  vi.waitFor(() => expect(output.stdout + output.stderr).toContain(text), {
    timeout: 20000,
    interval: 25,
  });

async function expectShutdown({ output, closed }, expectedCode) {
  const { code, signal } = await closed;

  expect({ code, signal }, output.stdout + output.stderr).toEqual({
    code: expectedCode,
    signal: null,
  });
  expect(occurrences(output.stdout, "shutdown complete"), output.stdout).toBe(1);
}

describe("server.js startup", () => {
  it("reads .env from its working directory before it builds the config", async () => {
    // PORT and MONGODB_URI exist only in .env: the port in the banner and the
    // connection prove it was loaded before config/default.js read them
    const port = await freePort();
    fs.writeFileSync(
      path.join(cwd, ".env"),
      `PORT=${port}\nMONGODB_URI=${inject("mongoUri")}lifecycle\nJWT_SECRET=${JWT_SECRET}\n`
    );

    const running = startServer({ NODE_ENV: "development" });

    await untilOutput(running, `Server running on port ${port}`);
  });

  it("runs the same shutdown and exits 1 when the port is taken", async () => {
    const occupant = await listenTcp();
    const running = startServer(testEnv({ port: occupant.address().port }));

    await expectShutdown(running, 1);
    expect(running.output.stderr).toContain("EADDRINUSE");
    expect(running.output.stdout).not.toContain("Server running");
  });
});

// Node on Windows never calls a SIGTERM handler, so these tests run on Linux
// (CI, or Docker locally) and are skipped on Windows.
describe.skipIf(process.platform === "win32")("server.js signals", () => {
  it.each(["SIGTERM", "SIGINT"])(
    "exits 0 and logs 'shutdown complete' once after %s",
    async (signal) => {
      const running = startServer();
      await untilOutput(running, "Server running");

      running.child.kill(signal);

      await expectShutdown(running, 0);
      // database.js logs this when the connection closes: proves that the
      // shutdown disconnected from the database
      expect(running.output.stderr).toContain("MongoDB disconnected");
    }
  );

  it("handles two SIGTERM in a row the same way", async () => {
    const running = startServer();
    await untilOutput(running, "Server running");

    running.child.kill("SIGTERM");
    running.child.kill("SIGTERM");

    await expectShutdown(running, 0);
  });

  it("waits for open connections, then disconnects, and ignores a second signal meanwhile", async () => {
    const port = await freePort();
    const running = startServer(testEnv({ port }));
    await untilOutput(running, "Server running");

    const client = await holdRequestOpen(port);

    running.child.kill("SIGTERM");
    await untilOutput(running, "Shutting down (SIGTERM)");
    running.child.kill("SIGTERM");
    await sleep(300);

    expect(running.child.exitCode, "exited with a connection open").toBeNull();
    expect(running.output.stdout).not.toContain("shutdown complete");
    expect(running.output.stderr).not.toContain("MongoDB disconnected");
    expect(occurrences(running.output.stdout, "Shutting down")).toBe(1);

    client.destroy();

    await expectShutdown(running, 0);
    expect(running.output.stderr).toContain("MongoDB disconnected");
  });

  it(
    "gives up after the 10 s deadline: exits 1 with 'shutdown timed out' while a request never completes",
    async () => {
      const port = await freePort();
      const running = startServer(testEnv({ port }));
      await untilOutput(running, "Server running");
      await holdRequestOpen(port);

      const signalledAt = Date.now();
      running.child.kill("SIGTERM");

      const { code, signal } = await running.closed;
      const waitedMs = Date.now() - signalledAt;

      expect({ code, signal }, running.output.stdout + running.output.stderr).toEqual({
        code: 1,
        signal: null,
      });
      expect(running.output.stderr).toContain("shutdown timed out");
      expect(running.output.stdout).not.toContain("shutdown complete");
      // The deadline ended it: not earlier, and not hung (the test timeout
      // below is the final bound)
      expect(waitedMs).toBeGreaterThanOrEqual(9000);
      expect(waitedMs).toBeLessThan(15000);
    },
    20000
  );

  it(
    "exits at once on SIGTERM while the database connection is still pending",
    async () => {
      // Accepts TCP connections and never answers, so the driver keeps
      // connecting and the HTTP server does not exist yet
      const blackhole = await listenTcp({
        host: "127.0.0.1",
        onConnection: (socket) => sockets.add(socket),
      });
      const connecting = new Promise((resolve) =>
        blackhole.once("connection", resolve)
      );

      const running = startServer(
        testEnv({
          mongodbUri: `mongodb://127.0.0.1:${blackhole.address().port}/lifecycle`,
        })
      );
      await connecting;

      running.child.kill("SIGTERM");

      await expectShutdown(running, 0);
      expect(running.output.stdout).not.toContain("Server running");
    },
    10000
  );
});
