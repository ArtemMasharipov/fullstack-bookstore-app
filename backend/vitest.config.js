import { availableParallelism } from "node:os";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Many MongoDB workers and child CLIs contend on large Windows hosts.
    // Keep the usual half-CPU budget, capped at four, without extending timeouts.
    maxWorkers: Math.min(4, Math.max(1, Math.floor(availableParallelism() / 2))),
    globalSetup: ["./tests/global-setup.js"],
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.test.js"],
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
