# CONGRATS — TEAM HANDOFF (Full-Stack Integration, FINAL)

Bilingual (AR default / EN), RTL-correct Next.js 15 App Router app for building and
sharing animated, occasion-native congratulation experiences with a manual InstaPay
payment + admin approval flow.

**Integration status:** `npx tsc --noEmit` ✅ 0 errors · `npm run build` ✅ (exits 0,
0 `MISSING_MESSAGE`, 45 app routes) · `npm test` ✅ 17/17 · `npm run db:seed` ✅
(8 categories + 16 templates) · `npm run dev` ✅ starts clean.

---

## 1. Final architecture

```
app/
  layout.tsx                      Root pass-through (no <html>); locale layout owns it
  not-found.tsx                   Global 404 (locale-neutral, NO next-intl dependency)  ← ADDED
  [locale]/
    layout.tsx                    <html dir> + fonts + NextIntlClientProvider(messages)  ← FIXED
    (marketing)/                  Landing (hero+live demo, occasions, pricing, FAQ)      [D1]
    (dashboard)/                  Auth-gated: My Experiences, builder wizard, checkout    [D1]
    (admin)/                      Admin-gated: queue, templates, categories, pricing…     [D2]
    login/                        Dev credentials login                                   [F0]
    p/[slug]/                     Public recipient player (server-side unlock gate)        [F0/reviewer]
  api/
    dashboard/**                  User backend (experiences, steps, media, orders, share)  [B1]
    dashboard/templates/          Catalog for the builder picker                           ← ADDED (reviewer)
    admin/**                      Admin backend (queue, approve/reject, CRUD, audit)       [B2]
    storage/[bucket]/[...key]/    Signed-URL streaming w/ ownership re-check                [B1]
    auth/[...nextauth]/           Auth.js                                                   [F0]
server/
  dashboard/**                    User services (experiences, media, orders, share)        [B1]
  dashboard/editor-view.ts        Adapter: B1 nested payload → D1 flat EditorExperience    ← ADDED (reviewer)
  admin/**                        Admin services + DB-backed OrderEffects                  [B2]
  admin/order-view.ts             Adapter: B2 QueueRow → D2 flat OrderRow (+signed URLs)   ← ADDED (reviewer)
  db-context.ts, storage.ts       Ownership-scoped data access + storage adapter           [F0]
lib/
  template-contract.ts            TemplateDefinition / BoundExperience + zod validators     [F0]
  orders/state-machine.ts         Pure order state machine (the ONLY unlock path)           [F0]
  auth.ts                         getSession / requireUser / requireAdmin                    [F0]
content/templates/**              16-template AR/EN catalog (validated at module load)       [D-catalog]
db/{schema,index,seed}.ts         Drizzle schema + PGlite mirror + seed (wires catalog)      [F0/reviewer]
i18n/**, messages/**              Locale routing + per-namespace messages (AR+EN parity)     [F0/D1/D2]
components/{ui,player,marketing,dashboard,admin}/  UI kit, shared Player, feature UIs
```

**Key invariants**
- **Unlock is single-sourced.** `experience.isUnlocked` is only ever set `true` by the
  order state machine's `setExperienceUnlocked` effect (admin approve) or by the
  contract-sanctioned free-template publish in `share-service.ts`. No route toggles it directly.
- **Every owned query is user-scoped** via `userContext()` / `repo.*(db, userId, …)`.
- **The public gate is server-side**: `getPublicExperienceBySlug` returns `null` unless
  link active + visibility≠disabled + not expired + `isUnlocked` → paid/unapproved
  experiences render the neutral page, never content.
- **Money is integer piastres**, currency EGP.

---

## 2. Ownership map (unchanged from F0 contract)

| Team | Owns |
|------|------|
| F0 (foundation) | root config, `db/**`, `lib/*`, `components/{player,ui}`, `i18n/**`, `middleware.ts`, root + locale + login layouts, `app/[locale]/p/[slug]/**`, auth route |
| D1 (designer) | `(marketing)/**`, `(dashboard)/**`, `components/{marketing,dashboard}`, `messages/*/{marketing,dashboard}.json` |
| D2 (designer) | `(admin)/**`, `components/admin/**`, `messages/*/admin.json` |
| B1 (backend) | `server/dashboard/**`, `app/api/dashboard/**`, `app/api/storage/**` |
| B2 (backend) | `server/admin/**`, `app/api/admin/**` |
| D-catalog | `content/templates/**` |
| **Reviewer (me)** | integration glue: `db/seed.ts` wiring, the two adapters, `/api/dashboard/templates`, locale-provider fix, global `not-found`, auth gating, `.env`, dependency bump |

---

## 3. What each agent delivered

- **D1** — Marketing landing with live mini-player; user dashboard shell; My Experiences
  list with status badges + WhatsApp/QR share; 3-step builder wizard (details →
  personalize-with-live-preview → review) with debounced autosave; InstaPay checkout +
  order-status polling. Typed `dashboardApi` client + `uploadAndConfirm`.
- **D2** — Admin shell (sidebar, server-action logout); overview; payment approval queue +
  review drawer (zoom/rotate proof viewer, expected-vs-claimed, in-drawer Player preview,
  approve/reject); template CRUD with JSON definition editor (validated against the
  contract); category CRUD; pricing; users block/unblock; audit log.
- **B1** — Full user backend with service/repo/route separation: experiences CRUD (clones
  template scenes → steps), slot-validated step upsert, media sign/confirm + multipart,
  paid-order creation, payment submission via `transitionOrder`, share-link slugs,
  free-vs-paid publish, gated public render with signed media URLs, storage streaming route.
- **B2** — Full admin backend: review queue, approve/reject (ONLY via `transitionOrder` +
  DB-backed `OrderEffects`), template/category CRUD, pricing, users, audit, share-link
  moderation. Every mutation audited; all inputs zod-validated.
- **D-catalog** — 16 occasion-native templates (AR-native + EN-native × 8 occasions) +
  8 categories, each definition validated against the contract at module load.

---

## 4. Integration fixes made by the reviewer

1. **next-intl provider was broken for SSR.** `app/[locale]/layout.tsx` rendered
   `<NextIntlClientProvider>` **without `messages`**, so every *client* component using
   `useTranslations` threw `MISSING_MESSAGE: No messages were configured on the provider`
   during prerender. Fixed by passing `locale` + `await getMessages()`. This was a real
   latent bug affecting the whole app, not just a warning.
2. **Catalog wired into the seed.** `db/seed.ts` now upserts all 8 `CATALOG_CATEGORIES`
   and inserts all 16 `TEMPLATE_CATALOG` templates (definitions pre-validated by the
   contract at import). Idempotent on slug; the two original seed slugs are preserved.
3. **Dashboard editor payload shape drift.** B1 returns nested
   `{experience, template, steps, shareLink}`; D1's wizard consumes a flat
   `EditorExperience` (scenes/theme/pricing inline + `steps` as `BoundStep[]` with signed
   media URLs). Added `server/dashboard/editor-view.ts` and applied it in
   `GET /api/dashboard/experiences/:id`. Also surfaces `orderId` + `shareSlug`.
4. **Missing builder template picker route.** Added `GET /api/dashboard/templates`
   (authenticated) returning published templates as `TemplateCard[]` (palette pulled from
   the definition theme). D1's picker previously degraded to an empty state on 404.
5. **Order response unwrapping.** B1 wraps order payloads under `{ order }`; D1's checkout
   consumes a flat `OrderInfo`. Updated `components/dashboard/api-client.ts` to unwrap
   `createOrder` / `getOrder` / `submitOrder` (tolerant of a flat body too).
6. **Admin queue/detail shape drift + signed screenshot URLs.** B2 returns nested
   `QueueRow` (`experience{}`, `screenshot{bucket,storagePath}`, no URL); D2 renders a flat
   `OrderRow` with `screenshotUrl`, `recipientName`, `templateTitleEn/Ar`, `buyerEmail`,
   and a `BoundExperience` for the in-drawer Player. Added `server/admin/order-view.ts`:
   flattens rows, mints a signed `screenshotUrl` (admins may stream `payment-proofs`), and
   binds the experience for the detail endpoint. The detail route now returns the flat row
   **directly** (ReviewDrawer reads it un-enveloped).
7. **Public player now renders recipient photos.** `app/[locale]/p/[slug]/page.tsx` now
   imports B1's `getPublicExperienceBySlug` (same unlock gate as the F0 stub **plus** media
   binding to signed URLs) instead of the media-stubbed `load-experience.ts`.
8. **Auth gating.** Added a `getSession()` redirect-to-`/login` gate to the `(dashboard)`
   layout (admin layout already had `requireAdmin`). Verified: `/dashboard`, `/builder`,
   `/admin` → 307 → `/login` when anonymous; dashboard/admin APIs → 401.
9. **Global `not-found.tsx`** (locale-neutral, no next-intl) for unmatched top-level paths.
10. **`.env` created** from `.env.example` so `AUTH_SECRET` is set (was throwing
    `MissingSecret`).
11. **Security: Next.js bumped `15.1.3 → 15.5.19`** (+ matching `eslint-config-next`). This
    clears the **critical Next.js middleware authorization-bypass** (GHSA-f82v-jwr5-mffw,
    fixed ≥15.2.3) and the SSRF / cache-poisoning / RSC advisories that affected 15.1.x.
    Stayed within Next 15 to minimize breakage; build + tests + typecheck all green after.

No new runtime dependencies were added.

---

## 5. How to run

```bash
cp .env.example .env        # already done; sets AUTH_SECRET, SEED_ADMIN_EMAIL, INSTAPAY_HANDLE
npm install                 # done (next@15.5.19)
npm run db:seed             # PGlite under .data/pglite → 8 categories, 16 templates, demo admin
npm run dev                 # http://localhost:3000  (redirects / → /ar)
npm run build               # production build (exits 0)
npm test                    # 17/17
```

- **Login (dev):** visit `/ar/login`, enter any email → upserts a user. Email ==
  `SEED_ADMIN_EMAIL` (`admin@congrats.dev`) becomes a superadmin (admin panel access).
- **Offline by default:** no `DATABASE_URL` → PGlite. `PGLITE_PATH=memory://` for ephemeral.
- **Prod:** set `DATABASE_URL` (Neon) + `npm run db:push`; `STORAGE_DRIVER=r2`.

---

## 6. Known gaps / TODOs

- **Security advisories remaining are dev/test-tooling only** — `vitest`/`@vitest/mocker`
  (critical, UI server file-read; not used in prod), `esbuild` (dev-server), and a
  `drizzle-orm` SQL-identifier-escaping advisory (high; this codebase uses only the typed
  query builder, no raw identifiers). `next-auth` is on `5.0.0-beta.25` (an email-delivery
  advisory applies to its Email provider, which we do not use — dev uses Credentials).
  Fixing these needs major-version bumps to test tooling; deferred to avoid destabilizing.
- **Buyer-claimed amount:** the orders schema stores a single `amountPiastres` (the charged
  amount). The review drawer shows expected==claimed with a "match" badge. A genuine
  buyer-claimed amount would need a schema/submit-flow field (F0/B1/B2).
- **Per-step image slot precision:** media has no slot-key column, so step images bind to
  the scene's first image slot. Multi-image-slot scenes need a `media.slot_key` column.
- **Real thumbnails:** templates seed with `thumbnailUrl = null`; UI uses gradient
  placeholders and will prefer real URLs automatically once generated from `thumbnailHint`.
- **Cross-user duplicate-screenshot detection** is advisory and per-user on submit; B2 flags
  duplicates by shared storage path in the queue. A content-hash column would be stronger.
- **Decorative QR** placeholder (no QR dependency added) — swap for a real lib if desired.
- **End-to-end live smoke** (create→edit→pay→approve→share) is wired and type-safe; a full
  click-through with uploaded media against the running dev server is recommended pre-launch.
