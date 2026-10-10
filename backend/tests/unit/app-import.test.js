import http from "node:http";
import mongoose from "mongoose";
import { afterEach, describe, expect, it, vi } from "vitest";

// Deliberately no useTestDatabase(): the file shows that importing app.js alone
// opens no port and makes no database connection.
afterEach(() => {
  vi.restoreAllMocks();
});

describe("importing app.js", () => {
  it("opens no port and makes no database connection", async () => {
    const listen = vi.spyOn(http.Server.prototype, "listen");
    const connect = vi.spyOn(mongoose, "connect");

    const { default: app } = await import("../../app.js");

    expect(typeof app).toBe("function");
    expect(listen).not.toHaveBeenCalled();
    expect(connect).not.toHaveBeenCalled();
    expect(mongoose.connection.readyState).toBe(0);
  });
});
