import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config for the Congrats Next.js 15 app.
 *
 * IMPORTANT: PGlite (the in-process Postgres at .data/pglite) can only be opened
 * by ONE Next.js process at a time. Playwright OWNS the single dev server here
 * (reuseExistingServer: false) on a fixed port (3100). Do NOT start another
 * `next dev` against this repo while the suite runs.
 */
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // Run serially: there is a single shared PGlite-backed dev server + DB.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  // Dev-mode compiles each route on first hit; a full invitation walk (login,
  // create, upload, publish, scroll 12 sections) needs headroom beyond 60s.
  timeout: 120_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // Seed a dedicated e2e database (fresh admin with a known password + full
    // template catalog), then start the dev server. Fixed port so baseURL is
    // deterministic; AUTH_URL aligned so Auth.js v5 redirect URLs match.
    // `mkdir -p .data` first: PGlite creates only the leaf directory, so on a
    // fresh checkout (CI, a new worktree) the seed died with ENOENT.
    command: `mkdir -p .data && npm run db:seed && next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      AUTH_URL: BASE_URL,
      NEXTAUTH_URL: BASE_URL,
      AUTH_SECRET: 'e2e-test-secret-not-used-in-prod-000000000000',
      PGLITE_PATH: '.data/pglite-e2e',
      // The seeded admin uses the same password the e2e login helper submits.
      SEED_ADMIN_PASSWORD: 'e2e-password-123',
      // Comped (users.all_access) account for the "comped publishes a paid
      // template free" path. There is no admin API to grant all_access and the
      // test process must not open PGlite while the server owns it, so the seed
      // (which runs BEFORE the server starts) is the only safe place to create it.
      SEED_TESTER: '1',
      // Every test registers/logs in from 127.0.0.1; the per-IP auth limits
      // (5 registrations, 20 logins a minute) would otherwise fail the suite.
      // lib/rate-limit.ts ignores this flag when NODE_ENV=production.
      RATE_LIMIT_DISABLED: '1',
      SEED_TESTER_EMAIL: 'e2e-comped@example.com',
      SEED_TESTER_PASSWORD: 'e2e-password-123',
    },
  },
});
