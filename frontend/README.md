# Bookstore Frontend

Vue 3 + Pinia + Vuetify 3 single-page app built with Vite.

Setup (Node 24), configuration, running it together with the backend, seed data, tests and known limitations are
described in the [root README](../README.md).

## Commands

Run them from `frontend/`:

```bash
npm ci                # install dependencies (Node 24)
npm run dev           # dev server on http://localhost:8080, proxies /api to http://localhost:3000
npm run build         # production build into dist/ in the repository root
npm test              # unit tests (vitest + happy-dom)
npm run test:e2e      # Playwright smoke test (run `npx playwright install chromium` once before)
npm run lint          # ESLint, only checks
npm run format:check  # Prettier, only checks
```
