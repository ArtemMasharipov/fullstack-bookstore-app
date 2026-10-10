/**
 * Request logger
 * One line per response: method, path without the query string, status and
 * duration. Query, headers and body are never logged, so tokens and passwords
 * sent in them cannot end up in the logs.
 */

export function createRequestLogger({ log = console.log } = {}) {
  return (req, res, next) => {
    const startedAt = performance.now();

    res.on("finish", () => {
      const path = req.originalUrl.split("?")[0];
      const durationMs = Math.round(performance.now() - startedAt);
      log(`${req.method} ${path} ${res.statusCode} ${durationMs}ms`);
    });

    next();
  };
}
