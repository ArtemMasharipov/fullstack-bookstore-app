// A process crash must fail the parent test, never take down the Vitest worker.
// The parent supplies a temporary cwd and sanitized environment; no DB is used.
import http from "node:http";
import { once } from "node:events";
import { gzipSync } from "node:zlib";
import app from "../../app.js";

const contentType = process.argv[2];
if (
    !["application/json", "application/x-www-form-urlencoded"].includes(
        contentType
    )
)
    throw new Error("Unsupported test content type");
const plain = Buffer.from(
    contentType === "application/json" ? "{}" : "emailOrUsername=reader"
);
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const port = server.address().port;

function send(body, encoding) {
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                host: "127.0.0.1",
                port,
                path: "/api/v1/auth/login",
                method: "POST",
                agent: false,
                headers: {
                    "Content-Type": contentType,
                    "Content-Length": body.length,
                    ...(encoding ? { "Content-Encoding": encoding } : {}),
                },
            },
            (res) => {
                let text = "";
                res.setEncoding("utf8");
                res.on("data", (chunk) => {
                    text += chunk;
                });
                res.on("error", reject);
                res.on("end", () =>
                    resolve({ status: res.statusCode, body: JSON.parse(text) })
                );
            }
        );
        req.on("error", reject);
        req.setTimeout(5000, () =>
            req.destroy(new Error("Local request did not finish"))
        );
        req.end(body);
    });
}

try {
    const identity = await send(plain);
    const compressed = await send(gzipSync(plain), "gzip");
    const malformed = await send(Buffer.from("invalid gzip"), "gzip");
    // One complete gzip frame and NUL cause early decompressor completion. The
    // remaining bounded bytes arrive in later socket reads after parser success.
    const trailing = await send(
        Buffer.concat([
            gzipSync(plain),
            Buffer.from([0]),
            Buffer.alloc(128 * 1024, 0x58),
        ]),
        "gzip"
    );
    const health = await new Promise((resolve, reject) => {
        http.get(
            { host: "127.0.0.1", port, path: "/api/v1/health", agent: false },
            (res) => {
                res.resume();
                res.on("end", () => resolve(res.statusCode));
                res.on("error", reject);
            }
        ).on("error", reject);
    });
    console.log(
        JSON.stringify({ identity, compressed, malformed, trailing, health })
    );
} finally {
    await new Promise((resolve) => server.close(resolve));
}
