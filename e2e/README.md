# E2E tests (Playwright)

End-to-end browser tests proving the whole Congrats product works: smoke/i18n,
auth gating, login, the builder picker and public `/templates` gallery, free
publish→play, the paid "money path" (publish→pay→admin approve/reject→unlock),
comped (`all_access`) publishing, every catalog template rendering, one-page
invitation sections, and negatives.

## Prereqs

```bash
npm install                       # installs @playwright/test (devDependency)
npx playwright install chromium   # downloads the browser (needs network once)
```

If the chromium download is blocked, set a system Chrome channel in
`playwright.config.ts` (`use: { channel: 'chrome' }`).

## Run

```bash
npx playwright test                         # headless, full suite
npx playwright test e2e/money-path.spec.ts  # one spec
npx playwright test --headed                # watch it in a browser
```

## Specs

| Spec | Covers |
| --- | --- |
| `smoke` | locale redirect, RTL/LTR, landing hero, language toggle |
| `auth` | logged-out gating (pages + API), login, non-admin bounced from /admin |
| `gallery` | builder picker cards, catalog shape, public `/templates` render + occasion filter (EN + AR) |
| `free-publish-play` | picker → wizard → publish → share link plays |
| `money-path` | paid: locked → submitted still locked → admin approves in UI → plays; reject stays locked |
| `invitation-comped` | comped account publishes a paid invitation with no payment; normal account still gets 202; Families / Event / Venue / RSVP / Gift sections render (AR + EN) |
| `templates` | EVERY catalog template: per-scene sentinel visible + revealed after scrolling to its section |
| `fillable` | builder upload affordances; 1 photo + gallery photos render in the right sections; empty photo scenes are dropped |
| `admin-and-negative` | admin queue + templates load; bogus slug shows the neutral page |

## How it works / important notes

- **Playwright owns the dev server.** `playwright.config.ts` runs
  `mkdir -p .data && npm run db:seed && next dev -p 3100` (`reuseExistingServer:
  false`) against its own DB at `.data/pglite-e2e`. `AUTH_URL`/`NEXTAUTH_URL`
  are aligned to that port so Auth.js redirects match.
- **One server only.** PGlite can be opened by ONE process at a time. Do not
  run `npm run dev` on the same DB while the suite runs; tests run serially.
- **Seeded accounts.** The seed runs before the server starts with
  `SEED_ADMIN_PASSWORD` and `SEED_TESTER=1` so it creates the admin
  (`admin@congrats.dev`) and a comped account (`e2e-comped@example.com`), both
  with the shared e2e password. There is no admin API to grant `all_access`, and
  the test process must not open PGlite while the server owns it, so the seed is
  the only safe place to create the comped user.
- **The DB persists between runs.** Tests identify their own rows by unique
  handles (each order's `orderRef`, each published slug) and use fixed per-test
  emails, so reruns stay green. Delete `.data/pglite-e2e` for a clean slate.
- **The Player is one scrolling card.** Each scene is a
  `<section data-scene="<stepId>">` whose content rises in on first scroll-in;
  on `/p/<slug>` an open gate ("Open" / "افتح الدعوة") sits over it. Helpers
  (`openGateIfPresent`, `expectSceneText`, `assertPlayerPlays`) open the gate,
  scroll each section into view and assert the text is visible AND its
  effective opacity reached ~1 — Playwright's `toBeVisible` alone accepts
  `opacity: 0`. Photo scenes with no photo are intentionally omitted by the
  Player, so specs that need them upload a 1×1 PNG first.
