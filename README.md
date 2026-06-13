# Congrats

Bilingual (AR default / EN) platform for personalized, step-by-step **animated congratulations** experiences with a custom shareable link and a manual InstaPay payment + admin approval flow.

## Stack

Next.js 15 (App Router, TS) · Tailwind · Drizzle ORM · Postgres (PGlite in dev/test, Neon in prod) · Auth.js (dev Credentials provider) · next-intl · Motion (framer-motion) + canvas-confetti · money in integer **piastres** (EGP).

## Run

```bash
cp .env.example .env        # leave DATABASE_URL unset for offline PGlite
npm install
npm run db:seed             # seeds categories + 2 templates + demo admin
npm run dev                 # http://localhost:3000  (redirects to /ar)
npm run build
npm test                    # vitest (jsdom)
```

- **Offline by default:** with no `DATABASE_URL`, the app runs an in-process Postgres (PGlite) under `.data/pglite` — no network needed.
- **Dev login:** `/login` → enter any email. The `SEED_ADMIN_EMAIL` (default `admin@congrats.dev`) becomes an admin.
- **Player:** unlocked experiences play at `/[locale]/p/[slug]`.

## Ownership

This repo's foundation (root config, `db/**`, contracts, player, i18n, auth, server base, UI kit) is **frozen** and owned by F0. See the handoff doc for the directory-ownership map, API signatures, and contracts before editing anything.

## Key contracts

- Template engine: `lib/template-contract.ts` (`TemplateDefinition`, `BoundExperience`).
- Order state machine: `lib/orders/state-machine.ts` (`transitionOrder`).
- Storage: `server/storage.ts` (`StorageAdapter`).
- Data access: `server/db-context.ts` (ownership-scoped).
- Auth: `lib/auth.ts` (`getSession`, `requireUser`, `requireAdmin`).

## i18n namespacing

`messages/<locale>/<namespace>.json` merged under the namespace key. F0 owns `common.json`; D1 owns `marketing.json` + `dashboard.json`; D2 owns `admin.json`. No two teams edit the same file.
