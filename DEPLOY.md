# Deploying Congrats to production

This app is a Dockerized Next.js 15 server. In production it uses **Postgres**
(set `DATABASE_URL`); with no `DATABASE_URL` it can fall back to in-process
PGlite — fine for a single-container demo, not for real multi-user production,
so it must be explicitly allowed (`ALLOW_PGLITE_IN_PRODUCTION=true`).

On boot the container automatically:
1. Defaults `AUTH_URL` to the platform URL on Render (`RENDER_EXTERNAL_URL`) or
   Fly (`https://$FLY_APP_NAME.fly.dev`) if you didn't set it.
2. Generates a strong `AUTH_SECRET` if you didn't set one (persisted to the data
   volume) — it never runs with a known/default secret.
3. Generates an admin password if `SEED_ADMIN_PASSWORD` is unset (printed **once**
   in the logs).
4. Applies the **versioned DB migrations** in `drizzle/` (`drizzle-kit migrate`),
   then runs the idempotent seed (categories, templates, admin user).
   Databases created by older images with `drizzle-kit push` (tables but no
   migration history) are detected once, synced with `push`, and baselined so
   every later boot uses plain `migrate`.
5. Validates the environment (`lib/env.ts`, run from `instrumentation.ts`).
   A missing/placeholder **required** var prints every problem at once and the
   process **exits 1** — the platform health check fails instead of the site
   half-working. Missing optional integrations only log a warning.

---

## Environment variables

### Required in production (boot fails without them)

| Var | Notes |
|-----|-------|
| `DATABASE_URL` | `postgres://` / `postgresql://` URL. Omit only with `ALLOW_PGLITE_IN_PRODUCTION=true`. |
| `AUTH_SECRET` | `openssl rand -base64 32` (≥ 32 chars; the repo placeholders are rejected). The Docker entrypoint generates one if unset — set it explicitly for multiple instances so sessions are shared. |
| `AUTH_URL` | Public URL, e.g. `https://congrats.example.com`. Auto-filled on Render/Fly (see above). `http://` on a public host is allowed but warned. |
| `INSTAPAY_HANDLE` | The InstaPay handle buyers pay to. |

### Recommended

| Var | Notes |
|-----|-------|
| `AUTH_TRUST_HOST` | `true` behind a platform proxy. |
| `SEED_ADMIN_EMAIL` | Default `admin@congrats.dev`. Use your own. |
| `SEED_ADMIN_PASSWORD` | Your admin login password. Auto-generated + logged once if unset. |

### Optional (a boot warning is printed for each one left unset)

| Var | Build-time? | Notes |
|-----|:-:|-------|
| `RESEND_API_KEY` | | Real password-reset emails. Without it, reset links are only logged server-side. |
| `EMAIL_FROM` | | e.g. `Congrats <no-reply@yourdomain.com>`. |
| `SENTRY_DSN` | ✅ + runtime | Turns on error tracking (server, edge, browser). Unset = Sentry is never initialised and not wired into the build. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | ✅ | Cookie-less Plausible analytics for this domain. Unset = no script. |
| `NEXT_PUBLIC_COMPANY_NAME` | ✅ | Shown on legal/contact pages. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | ✅ | Shown on legal/contact pages. |

### Advanced / optional (no warning)

| Var | Build-time? | Notes |
|-----|:-:|-------|
| `ALLOW_PGLITE_IN_PRODUCTION` | | `true` to knowingly run without Postgres (single container). |
| `SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | runtime / ✅ | Defaults to `NODE_ENV`. |
| `SENTRY_TRACES_SAMPLE_RATE` | | 0–1, default `0` (errors only). |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | ✅ | Source-map upload. Only attempted when the token is present; without it the build never contacts Sentry. In Docker pass the token as a BuildKit secret: `docker build --secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN .` |
| `NEXT_PUBLIC_PLAUSIBLE_HOST` | ✅ | Self-hosted Plausible origin (default `https://plausible.io`). |
| `CSP_ENFORCE` | ✅ | `true` switches the CSP from Report-Only to enforced. |

> **Build-time vars.** `NEXT_PUBLIC_*` values are inlined into the browser
> bundle, and the security headers (CSP) are written into the build manifest,
> so these must exist when `next build` runs. The Dockerfile accepts them as
> build args. Render passes service env vars to the Docker build automatically;
> on Fly put them under `[build.args]` in `fly.toml`; with Compose they are
> forwarded from your `.env`. Changing one requires a **rebuild**, not a restart.
> Set the `NEXT_PUBLIC_*` ones at runtime too so the boot check doesn't warn.

---

## Security headers

Every response carries `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`,
`Referrer-Policy`, `Permissions-Policy`, HSTS, and a Content-Security-Policy
(`next.config.mjs`):

- **Always enforced** (cannot break rendering): `object-src 'none'; base-uri 'self'; frame-ancestors 'self'`.
- **Full policy, Report-Only by default**: `default-src 'self'`, scripts from
  self (+ Plausible when enabled), styles/fonts from self + Google Fonts, images
  from self/`data:`/`blob:`/`images.unsplash.com`, media from self, connections
  to self (+ Plausible / Sentry ingest when enabled), no frames/plugins.
  Violations appear in the browser console and, when `SENTRY_DSN` is set, are
  reported to Sentry's security endpoint.
- `'unsafe-inline'` scripts are allowed because the App Router inlines its RSC
  payload scripts; a nonce-based policy would force every page to render
  dynamically. `'unsafe-eval'` and `ws:` are added in dev only.

**To enforce:** open the site (home, gallery, 3D hero, editor with photo
upload, a shared card with music, admin) with devtools open, confirm there are
no `[Report Only]` CSP messages, then rebuild with `CSP_ENFORCE=true`. If you
move uploads to R2 or another CDN, add its origin to `img-src`/`connect-src`
first.

---

## Launch steps

1. **Pick the database.** Managed Postgres (Render/Fly/Neon). Keep the
   connection string handy.
2. **Choose secrets.** `openssl rand -base64 32` for `AUTH_SECRET`; pick an
   admin email + password.
3. **Fill the env** (table above) in your platform — at least the required
   four, plus `NEXT_PUBLIC_COMPANY_NAME` / `NEXT_PUBLIC_SUPPORT_EMAIL`.
4. **(Optional) Sentry:** create a Next.js project at sentry.io, copy its DSN
   into `SENTRY_DSN`. **(Optional) Plausible:** add the site in Plausible and set
   `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.
5. **Deploy** (Render / Fly / Compose below). Watch the boot log: it should end
   with `✓ Ready` after the `[env]` lines. Any `[env] Invalid production
   environment` block lists exactly what to fix.
6. Run the **post-deploy checklist** below.

## Option A — Render (closest to one-click) ⭐ recommended

1. Push this repo to GitHub.
2. render.com → **New → Blueprint** → connect the repo. Render reads
   [`render.yaml`](./render.yaml): it provisions a Postgres DB + the web service,
   generates `AUTH_SECRET` and the admin password, and builds the Docker image.
3. Render prompts for the `sync: false` values: fill **`INSTAPAY_HANDLE`**
   (required) and any optional ones (`RESEND_API_KEY`, `EMAIL_FROM`,
   `SENTRY_DSN`, `NEXT_PUBLIC_*`). `AUTH_URL` can stay empty — it defaults to the
   `onrender.com` URL; set it when you add a custom domain, then redeploy.
4. Find the generated admin password in the first deploy's logs. Log in, change it.
5. ⚠ The blueprint uses the **free** DB (expires ~30 days) — upgrade the DB plan
   for real production.

## Option B — Fly.io

Uses [`fly.toml`](./fly.toml). With the Fly CLI installed:

```bash
fly launch --no-deploy                 # create app (rename in fly.toml if taken)
fly postgres create                    # managed Postgres
fly postgres attach <pg-app-name>      # sets DATABASE_URL secret
fly secrets set AUTH_SECRET=$(openssl rand -base64 32) AUTH_TRUST_HOST=true \
  SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=$(openssl rand -base64 12) \
  INSTAPAY_HANDLE=you@instapay
# optional: fly secrets set RESEND_API_KEY=… EMAIL_FROM=… SENTRY_DSN=…
# build-time values (Plausible, company name, support email, Sentry DSN for the
# browser) go in fly.toml → [build.args]
fly deploy
```

## Option C — Any VPS (Docker Compose + Postgres)

```bash
# On the server, with Docker installed and the repo cloned:
cp .env.example .env         # then edit: AUTH_URL, INSTAPAY_HANDLE, a strong AUTH_SECRET, …
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up --build -d
```

Put Nginx/Caddy in front for TLS and point it at port 3000. The Postgres
override includes a healthcheck, `depends_on`, and binds Postgres to
`127.0.0.1` only. Change `POSTGRES_PASSWORD` (and `DATABASE_URL`) from the
default `congrats` before exposing the host.

Plain `docker compose up --build` (no override) runs the single-container PGlite
demo; it sets `ALLOW_PGLITE_IN_PRODUCTION=true` for you.

---

## Post-deploy checklist

- [ ] `GET /api/health` returns `{"status":"ok"}`.
- [ ] Boot log shows no `[env] Invalid production environment` and only the
      warnings you expect.
- [ ] Log in as admin, **change the password**, set a real admin email.
- [ ] Set `INSTAPAY_HANDLE` to your real handle; do a test purchase end-to-end
      (create → pay → upload proof → approve in `/admin` → link unlocks).
- [ ] `NEXT_PUBLIC_COMPANY_NAME` / `NEXT_PUBLIC_SUPPORT_EMAIL` set, and legal
      pages (privacy, terms, refunds, contact) read correctly.
- [ ] Set `RESEND_API_KEY` + verify a real password-reset email arrives.
- [ ] Point your domain at the app; confirm `AUTH_URL` matches it (auth/SEO/canonical).
- [ ] Sentry: trigger a test error and see it arrive (if enabled).
- [ ] Plausible: a page view appears in the dashboard (if enabled).
- [ ] CSP: browse the key pages with devtools open; no `[Report Only]`
      violations → rebuild with `CSP_ENFORCE=true`.
- [ ] Submit `https://<domain>/sitemap.xml` to Google Search Console.

## Rolling out schema changes later

```bash
npm run db:generate    # after editing db/schema.ts → creates drizzle/NNNN_*.sql
# commit the migration (the whole drizzle/ folder, incl. meta/); on deploy the
# entrypoint runs `db:migrate` automatically
```

## CI

`.github/workflows/ci.yml` runs typecheck, lint, unit tests, the production
build and `npm audit --omit=dev --audit-level=high` on every push/PR. A second
job runs the Playwright e2e suite in Chromium; it is `continue-on-error` until
it has proven stable on CI runners.
