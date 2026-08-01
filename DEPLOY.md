# Deploying Congrats to production

This app is a Dockerized Next.js 15 server. In production it uses **Postgres**
(set `DATABASE_URL`); with no `DATABASE_URL` it falls back to in-process PGlite
(great for local/demo, not for real multi-user production).

On boot the container automatically:
1. Generates a strong `AUTH_SECRET` if you didn't set one (persisted to the data
   volume) — it never runs with a known/default secret.
2. Generates an admin password if `SEED_ADMIN_PASSWORD` is unset (printed **once**
   in the logs).
3. Applies **versioned DB migrations** (`drizzle/`) then runs the idempotent seed
   (categories, 16 templates, admin user).

---

## Required environment variables (production)

| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | ✅ (prod) | Postgres connection string. Omit only for a PGlite demo. |
| `AUTH_SECRET` | recommended | `openssl rand -base64 32`. Auto-generated if unset (fine for a single instance; set it explicitly for multiple instances so sessions are shared). |
| `AUTH_URL` | ✅ | Your public URL, e.g. `https://congrats.example.com`. |
| `AUTH_TRUST_HOST` | ✅ | `true` behind a platform proxy. |
| `SEED_ADMIN_EMAIL` | optional | Default `admin@congrats.dev`. Use your own. |
| `SEED_ADMIN_PASSWORD` | recommended | Your admin login password. Auto-generated + logged once if unset. |
| `INSTAPAY_HANDLE` | ✅ (to sell) | The InstaPay handle buyers pay to. |
| `RESEND_API_KEY` | optional | Enables real password-reset emails. Without it, reset links are logged server-side only. |
| `EMAIL_FROM` | optional | e.g. `Congrats <no-reply@yourdomain.com>`. |

> **First thing after deploy:** change the admin password (log in → Account →
> Change password) and set a real `SEED_ADMIN_EMAIL`.

---

## Option A — Render (closest to one-click) ⭐ recommended

1. Push this repo to GitHub.
2. render.com → **New → Blueprint** → connect the repo. Render reads
   [`render.yaml`](./render.yaml): it provisions a Postgres DB + the web service,
   generates `AUTH_SECRET` and the admin password, and builds the Docker image.
3. When it's live, copy the service URL, set **`AUTH_URL`** to it (Environment tab),
   set **`INSTAPAY_HANDLE`**, and (optionally) `RESEND_API_KEY` + `EMAIL_FROM`,
   then **Manual Deploy → Deploy latest**.
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
  AUTH_URL=https://<app>.fly.dev SEED_ADMIN_EMAIL=you@example.com \
  SEED_ADMIN_PASSWORD=$(openssl rand -base64 12) INSTAPAY_HANDLE=you@instapay
fly deploy
```

## Option C — Any VPS (Docker Compose + Postgres)

```bash
# On the server, with Docker installed and the repo cloned:
cp .env.example .env         # then edit: set AUTH_URL, INSTAPAY_HANDLE, a strong AUTH_SECRET
docker compose -f docker-compose.yml -f docker-compose.postgres.yml up --build -d
```

Put Nginx/Caddy in front for TLS and point it at port 3000. The Postgres override
already includes a healthcheck and `depends_on`.

---

## Post-deploy checklist

- [ ] `GET /api/health` returns `{"status":"ok"}`.
- [ ] Log in as admin, **change the password**, set a real admin email.
- [ ] Set `INSTAPAY_HANDLE` to your real handle; do a test purchase end-to-end
      (create → pay → upload proof → approve in `/admin` → link unlocks).
- [ ] Fill the legal pages' placeholders (`[Company/Owner Name]`, `[support email]`,
      etc.) in `app/[locale]/(marketing)/{privacy,terms,refunds,contact}`.
- [ ] Set `RESEND_API_KEY` + verify a real password-reset email arrives.
- [ ] Point your domain at the app; confirm `AUTH_URL` matches it (OAuth/SEO/canonical).
- [ ] Add analytics + error tracking keys (see `INSTRUMENTATION` note in README).
- [ ] Submit `https://<domain>/sitemap.xml` to Google Search Console.

## Rolling out schema changes later

```bash
npm run db:generate    # after editing db/schema.ts → creates drizzle/NNNN_*.sql
# commit the migration; on deploy the entrypoint runs `db:migrate` automatically
```
