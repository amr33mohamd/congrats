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

## Run with Docker

```bash
docker compose up --build        # http://localhost:3000  (redirects to /ar)
```

A single self-contained container: in-process PGlite (no external DB), fully
offline. The entrypoint seeds the catalog + demo admin on first boot
(idempotent). PGlite data and uploaded media persist in the `congrats-data`
volume.

Production-like stack with a real Postgres instead of PGlite:

```bash
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up --build
```

This adds a `postgres:16` service, sets `DATABASE_URL`, applies the schema with
`drizzle-kit push`, then seeds — all automatically once the DB is healthy.

Override secrets/URLs via the environment (or a shell `.env`), e.g.
`AUTH_SECRET`, `AUTH_URL`, `SEED_ADMIN_EMAIL`, `INSTAPAY_HANDLE`. Generate a
secret with `openssl rand -base64 32`.

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
