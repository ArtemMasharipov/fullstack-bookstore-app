import { defineConfig, devices } from '@playwright/test'
import { SEEDED } from './e2e/credentials.js'

// The smoke test starts its own servers on dedicated ports: the API (an
// in-memory MongoDB, never the database of backend/.env) on 3100 and the built
// frontend on 4173. reuseExistingServer is off, so a dev stack running on 3000
// and 8080 can never be picked up: a busy port fails the run.
export default defineConfig({
    testDir: './e2e',
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'http://localhost:4173',
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /admin-catalog\.spec\.js/ },
        // Tests that change the catalogue run after every other test: the catalogue tests count the seeded books
        // and look for the newest one
        {
            name: 'admin-writes',
            use: { ...devices['Desktop Chrome'] },
            testMatch: /admin-catalog\.spec\.js/,
            dependencies: ['chromium'],
        },
    ],
    webServer: [
        {
            command: 'npm --prefix ../backend run e2e:server',
            url: 'http://localhost:3100/api/v1/health',
            reuseExistingServer: false,
            timeout: 180000,
            // SIGTERM lets the server stop mongod and remove its data directory (it exits within 8 s). Playwright
            // does this on Linux and macOS only; on Windows it kills the process tree, and a later start of the
            // server removes the directory once it is an hour old.
            gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 },
            // Fixed test passwords for the seeded users (e2e/credentials.js); not secrets
            env: {
                E2E_API_PORT: '3100',
                SEED_ADMIN_PASSWORD: SEEDED.admin.password,
                SEED_USER_PASSWORD: SEEDED.user.password,
            },
        },
        {
            command: 'npm run build && npx vite preview --port 4173 --strictPort',
            url: 'http://localhost:4173',
            reuseExistingServer: false,
            timeout: 180000,
            // The preview proxies /api to the e2e API; BROWSER=none keeps vite from opening a browser
            env: {
                API_PROXY_TARGET: 'http://localhost:3100',
                BROWSER: 'none',
                // Overrides the shell, and the process env wins over frontend/.env*: the bundle must use the proxy
                VITE_API_URL: '/api/v1',
            },
        },
    ],
})
