import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../app.js";
import { cartItemsBody } from "../../schemas/cart.js";
import { childEnv } from "../helpers/process.js";

const childPath = fileURLToPath(
    new URL("../helpers/compressed-request-child.js", import.meta.url)
);
const BOOK_ID = "64b7f0c2a1b2c3d4e5f60718";
let cwd;
beforeAll(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), "bookstore-request-security-"));
});
afterAll(() => {
    fs.rmSync(cwd, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
    });
});

describe("request parsing security boundaries", () => {
    it("rejects a hostile nested query with the existing validation envelope", async () => {
        const response = await request(app).get(
            "/api/v1/books?page[0][toString]=x"
        );

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_FAILED");
        expect(response.body.error.fields).toHaveProperty("page", "invalid_type");
        expect((await request(app).get("/api/v1/health")).status).toBe(200);
    });

    it("rejects a hostile nested form with the existing validation envelope", async () => {
        const response = await request(app)
            .post("/api/v1/auth/login")
            .type("form")
            .send("emailOrUsername[0][toString]=x&password=x");

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_FAILED");
        expect(response.body.error.fields).toHaveProperty(
            "emailOrUsername",
            "invalid_type"
        );
        expect((await request(app).get("/api/v1/health")).status).toBe(200);
    });

    it.each(["application/json", "application/x-www-form-urlencoded"])(
        "survives trailing gzip bytes and preserves %s validation",
        (contentType) => {
            const result = spawnSync(
                process.execPath,
                [childPath, contentType],
                {
                    cwd,
                    env: childEnv({
                        NODE_ENV: "test",
                        JWT_SECRET:
                            "request-security-test-only-0123456789abcdef0123456789",
                    }),
                    encoding: "utf8",
                    windowsHide: true,
                    timeout: 15000,
                }
            );
            expect(
                { code: result.status, signal: result.signal },
                result.stderr
            ).toEqual({
                code: 0,
                signal: null,
            });
            const output = JSON.parse(
                result.stdout.trim().split(/\r?\n/).at(-1)
            );
            for (const name of ["identity", "compressed", "trailing"]) {
                expect(output[name].status).toBe(400);
                expect(output[name].body.error.code).toBe("VALIDATION_FAILED");
                expect(output[name].body.error.fields.password).toBe(
                    "invalid_type"
                );
            }
            expect(output.malformed).toEqual({
                status: 400,
                body: {
                    success: false,
                    error: {
                        code: "UNKNOWN",
                        message: "Internal server error",
                    },
                },
            });
            expect(output.health).toBe(200);
        }
    );

    it("rejects an oversized guest cart before visiting or allocating element errors", () => {
        let visited = 0;
        const item = {
            get bookId() {
                visited += 1;
                return "invalid";
            },
            get quantity() {
                visited += 1;
                return -1;
            },
        };
        const result = cartItemsBody.safeParse({
            items: Array(1000).fill(item),
        });
        expect(visited).toBe(0);
        expect(result.success).toBe(false);
        expect(result.error.issues).toEqual([
            expect.objectContaining({
                code: "too_big",
                path: ["items"],
                maximum: 50,
            }),
        ]);
    });

    it("still parses all 50 permitted guest-cart items", () => {
        const items = Array.from({ length: 50 }, () => ({
            bookId: BOOK_ID,
            quantity: 1,
        }));
        expect(cartItemsBody.parse({ items })).toEqual({ items });
    });

    it("returns one bounded field error for an oversized HTTP cart without reaching the database", async () => {
        const response = await request(app)
            .post("/api/v1/cart/quote")
            .send({
                items: Array(51).fill({ bookId: "invalid", quantity: -1 }),
            });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            error: {
                code: "VALIDATION_FAILED",
                message: "Validation failed",
                fields: { items: "too_big" },
            },
        });
    });
});
