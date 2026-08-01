# E2E tests (Playwright)

End-to-end browser tests proving the whole Congrats product works: smoke/i18n,
auth gating, login, the template gallery, free publish→play, and the paid
"money path" (publish→pay→admin approve/reject→unlock) plus negatives.

## Prereqs

```bash
npm install                       # installs @playwright/test (devDependency)
npx playwright install chromium   # downloads the browser (needs network once)
```

If the chromium download is blocked, set a system Chrome channel in
`playwright.config.ts` (`use: { channel: 'chrome' }`).

## Run

```bash
npx playwright test                       # headless, full suite
npx playwright test e2e/money-path.spec.ts  # one spec
npx playwright test --headed              # watch it in a browser
npx playwright show-report                # last HTML report (on failure)
```

## How it works / important notes

- **Playwright owns the dev server.** `playwright.config.ts` starts
  `next dev -p 3100` itself (`webServer`, `reuseExistingServer: false`) and
  points `baseURL` at `http://localhost:3100`. `AUTH_URL`/`NEXTAUTH_URL` are
  aligned to that port so Auth.js redirects match.
- **One server only.** The app uses in-process PGlite at `.data/pglite`, which
  only ONE Next.js process can open at a time. Do not run `npm run dev`
  separately while the suite runs. Tests run serially (`workers: 1`).
- **The DB persists between runs.** Tests therefore identify their own rows by
  unique handles (e.g. each order's `orderRef`) and use fixed per-test emails
  (`e2e-<tag>@example.com`) — no `Date.now()`/random — so reruns stay green.
- **Auth.** Tests log in through the real `/en/login` dev-credentials form. The
  browser context's session cookie then authenticates `page.request.*`, which is
  used to set up state via the documented `/api/dashboard/*` endpoints. The
  recipient PLAYING and the LOCK/UNLOCK gate are always verified through the real
  `/en/p/<slug>` page; admin approve/reject is driven through the real admin
  Review drawer.
- **Admin.** Logging in with `admin@congrats.dev` unlocks the admin panel.

## Seed

The DB ships seeded (8 categories, 16 templates). If it's empty, run
`npm run db:seed` **while no dev server is running**.
