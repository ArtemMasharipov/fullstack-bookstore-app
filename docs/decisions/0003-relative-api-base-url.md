# 0003. Relative API base URL with a dev and preview proxy

- Status: accepted
- Date: 2026-10-10

## Context

The frontend's Axios client fell back to `http://localhost:3000/api/v1` when `VITE_API_URL` was not set:

- a build made without the variable sent every visitor's browser to port 3000 of the visitor's own machine;
- in development the page on port 8080 called the API on port 3000 across origins, which worked only because the API
  allowed any origin by default;
- the Vite dev server already forwarded `/api` to port 3000, but the client bypassed it.

## Decision

- The client's base URL is `import.meta.env.VITE_API_URL || '/api/v1'`. By default it calls `/api/v1` on the host
  that served the page. `VITE_API_URL` overrides it; Vite reads the variable when the dev server starts and when the
  app is built, and `frontend/.env.example` documents it.
- `vite.config.js` forwards `/api` to `API_PROXY_TARGET`, by default `http://localhost:3000`. The value comes from the
  process environment, not from `.env` files.
- `vite preview` uses the same proxy, because Vite's preview server takes `server.proxy` when no `preview.proxy` is
  set. The dev server (port 8080) and the preview server (port 4173, Vite's default) behave the same way.
- The end-to-end run builds the app with `VITE_API_URL=/api/v1` and previews it with
  `API_PROXY_TARGET=http://localhost:3100`. The values come from the Playwright configuration, which overrides the
  shell, and the process environment wins over `frontend/.env*` files. A URL set up for another environment therefore
  cannot send the test browser to a different API, and the smoke test checks that the catalogue response came through
  `http://localhost:4173/api/`.

## Consequences

- In development the browser talks to one origin: requests to `/api` reach the API through the proxy, so CORS does
  not come into play. The API no longer needs to allow any origin by default; outside production `CORS_ORIGIN`
  defaults to the dev server's `http://localhost:8080`
  ([decision 0001](0001-node-24-and-validated-configuration.md)).
- The bundle names no API host by default. The same build works behind any web server or reverse proxy that forwards
  `/api` to the API.
- Without such a proxy, the app has to be built with an absolute `VITE_API_URL`, and the API's `CORS_ORIGIN` has to
  allow the site's origin.
- `API_PROXY_TARGET` points the dev and preview servers at an API on another port or host; the end-to-end setup uses
  it for its API on port 3100.
- Unit tests pin the default base URL and the override by `VITE_API_URL`.
