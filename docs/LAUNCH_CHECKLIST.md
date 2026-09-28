# Launch checklist — what the owner must do to go live

Everything here needs **you** (accounts, money, legal names, secrets, licensed
assets). The code is ready for each step; this list says where each setting lives.
Work top to bottom — later sections depend on earlier ones. Tick as you go.

Deployment mechanics (Render / Fly / VPS) are in [`DEPLOY.md`](../DEPLOY.md); this
file is the owner's to-do list around it. Marketing timing is in
[`docs/MARKETING_PLAN.md`](./MARKETING_PLAN.md).

> Env var names marked † (Sentry, Plausible) are being added by the platform stream
> in parallel. Confirm the exact names in `.env.example` after that branch is merged.

---

## A. Hosting account + Postgres (≈ 1 hour)

- [ ] Push the repo to a **private** GitHub repository (Render/Fly deploy from it).
- [ ] Pick a host. Recommended: **Render** (Blueprint in `render.yaml` creates the web
      service + Postgres). Fly (`fly.toml`, region `cdg` Paris — closest to Egypt) or a
      VPS with `docker-compose.postgres.yml` also work.
- [ ] **Upgrade off the free plans before real customers:**
      - `render.yaml` → `databases[0].plan: free` expires after ~30 days. Choose a paid
        Postgres plan in the Render dashboard (Database → Settings → Plan).
      - `render.yaml` → `services[0].plan: free` sleeps when idle (first guest waits
        ~30–60 s for the invitation to load). Choose at least **Starter**.
      - Check current prices on the provider's pricing page before choosing.
- [ ] Turn on **daily automated backups** for Postgres (Render: paid plans include
      them; Fly: `fly postgres` snapshots; VPS: a cron `pg_dump` to off-site storage).
      Do one restore test into a scratch DB.
- [ ] Add a payment card to the hosting account and set a **billing alert**.

## B. Persistent file storage — required before launch

Recipient photos and InstaPay payment screenshots are written to local disk
(`server/storage.ts`, `LOCAL_STORAGE_ROOT`, default `.data/uploads`). On Render and
Fly the container disk is **wiped on every deploy** unless you attach a volume.
Without this, every couple's photos and every payment proof disappear on the next
deploy.

- [ ] **Render:** web service → Disks → add a disk (e.g. 5 GB) mounted at
      `/app/.data`, then set `LOCAL_STORAGE_ROOT=/app/.data/uploads`. (A disk requires a
      paid instance and limits you to one instance.)
- [ ] **Fly:** `fly volumes create congrats_data --size 5 --region cdg`, add a
      `[mounts]` section to `fly.toml` (`source = "congrats_data"`,
      `destination = "/app/.data"`) — ask a developer to add it — and set
      `LOCAL_STORAGE_ROOT=/app/.data/uploads`.
- [ ] **VPS:** `docker-compose.yml` already mounts the named volume `congrats-data` at
      `/app/.data`; include that volume in your backups alongside the DB.
- [ ] Later (more than one instance, or > 5 GB): Cloudflare R2. The `R2_*` variables
      exist in `.env.example`, but the R2 adapter is **not implemented yet** — do not
      set `STORAGE_DRIVER=r2` until a developer ships it.

## C. Domain + DNS (≈ 30 min + propagation)

- [ ] Buy the domain (e.g. a `.com` from Cloudflare Registrar / Namecheap; `.eg`
      needs local registration paperwork). Check the matching Instagram/TikTok handle
      is free **before** buying.
- [ ] Add the domain to the host (Render: Settings → Custom Domains; Fly:
      `fly certs add yourdomain.com`). Create the DNS records it shows (CNAME for
      `www`, A/ALIAS for the apex). Wait for the TLS certificate to issue.
- [ ] Redirect apex ↔ `www` one way only (pick one canonical host).
- [ ] Set **`AUTH_URL=https://yourdomain.com`** (exact canonical URL, no trailing
      slash). It drives login callbacks, `sitemap.xml`, `robots.txt` and canonical
      URLs (`app/sitemap.ts`, `app/robots.ts`, `app/[locale]/layout.tsx`). Redeploy.

## D. Environment variables

Set these in the host's secret store (Render: service → Environment; Fly:
`fly secrets set`; VPS: `.env` next to `docker-compose.yml`, never committed).

| Variable | Value | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Postgres URL | Render/Fly set it automatically when the DB is attached. |
| `AUTH_SECRET` | `openssl rand -base64 32` | Render generates it. Set explicitly if you ever run 2+ instances. |
| `AUTH_URL` | `https://yourdomain.com` | See §C. |
| `AUTH_TRUST_HOST` | `true` | Needed behind the platform proxy. |
| `SEED_ADMIN_EMAIL` | your real email | `render.yaml` defaults to `admin@congrats.dev` — **change it**. |
| `SEED_ADMIN_PASSWORD` | strong, from a password manager | Only used to create the admin on first boot; rotate in the app afterwards (§E). |
| `INSTAPAY_HANDLE` | e.g. `yourname@instapay` | Shown to buyers and snapshotted onto each order (§F). `docker-compose.yml` falls back to a placeholder `congrats@instapay` — buyers would pay a stranger. Always set it. |
| `LOCAL_STORAGE_ROOT` | `/app/.data/uploads` | Must point inside the persistent disk (§B). |
| `RESEND_API_KEY` | from Resend | §I. Without it, password-reset links are only logged on the server. |
| `EMAIL_FROM` | `Congrats <no-reply@yourdomain.com>` | Domain must be verified in Resend. |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` † | from Sentry | §J. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` † | `yourdomain.com` | §J. |
| `SEED_TESTER` | **leave unset** | `1` creates a comped QA login with a known default password (`db/seed.ts`). Never set it in production. |

## E. Admin account & access

- [ ] After the first deploy, log in with `SEED_ADMIN_EMAIL` / the password (Render:
      the generated one is printed **once** in the first deploy log).
- [ ] **Change the password immediately:** Profile (`/ar/profile`) → change password.
      Store it in a password manager. Then remove/replace `SEED_ADMIN_PASSWORD` in the
      host so the old value isn't lying around.
- [ ] Check `/ar/admin/users`: only you are admin; no `tester@congrats.dev` account
      exists (if it does, block it).
- [ ] Decide who gets `all_access` (comped) accounts — partners and influencers per
      `docs/MARKETING_PLAN.md` §7. Keep a list; revoke when a partnership ends (the
      check reads the DB on every publish, so revocation is immediate).
- [ ] Optional second admin (a trusted person) so payments get approved when you're away.

## F. Payments (InstaPay)

- [ ] Create/confirm an InstaPay **IPA handle** (`name@instapay`) on a bank account
      you check often. Consider a separate account for the business.
- [ ] Set `INSTAPAY_HANDLE` (§D). It is copied onto each order when created, so
      changing it later only affects new orders.
- [ ] Confirm prices. Current: free / 49 / 79 EGP; the plan recommends invitations at
      199 EGP. **Important:** `/admin/pricing` edits are overwritten on every deploy,
      because the boot-time seed re-applies prices from
      `content/templates/_helpers.ts` (`PRICE`) and each template file. Until a
      developer changes the seed, change prices in code and redeploy.
- [ ] Write your approval routine and stick to it: open `/ar/admin/queue` → open the
      proof → **confirm the money actually arrived in your bank app** (amount, time,
      sender name) → Approve. Never approve from the screenshot alone.
- [ ] Decide your approval hours and the promise shown to buyers (plan: within 2
      hours, 10:00–24:00).
- [ ] Refund process: how you send money back (InstaPay to the sender) and within how
      many days — this must match `/refunds` (§H).

## G. Content & licensed assets

- [ ] **Music** — no audio ships in the repo. Buy/licence 9 tracks and drop them in
      `public/audio/` with the exact names in [`public/audio/README.md`](../public/audio/README.md)
      (`wedding-strings.mp3` first — every invitation uses it). The licence must cover
      use inside a commercial web product played to the public (Artlist, Epidemic
      Sound, Musicbed or similar). Save the licence PDFs in a folder you keep.
      Missing files are handled gracefully (the music button just doesn't show).
- [ ] **Invitation illustration art** — optional but it is what makes invitations look
      premium. Follow [`docs/ART_BRIEF.md`](./ART_BRIEF.md): up to 4 files per style in
      `public/art/<style-key>/`, then set the style's `art` field in
      `content/templates/invitation.ts` and redeploy (the seed picks it up). Only use art
      you commissioned with a written licence, or generated with a tool whose terms
      allow commercial use. Never art from other invitation sites.
- [ ] **Photos** on the marketing site and demo cards: make sure you hold the rights
      (your own, stock with a licence, or people who agreed in writing).
- [ ] Make **3 hero demo invitations** (AR) and 2 greeting cards you're proud of — they
      become the `[demo link]` in `launch-kit/` and the screen recordings.

## H. Legal & company details

- [ ] Replace placeholders in the four legal pages (both English and Arabic halves of
      each file):
      - `app/[locale]/(marketing)/terms/page.tsx` — `[Company/Owner Name]`, `[support email]`
      - `app/[locale]/(marketing)/privacy/page.tsx` — `[Company/Owner Name]`, `[support email]`
      - `app/[locale]/(marketing)/refunds/page.tsx` — `[Company/Owner Name]`, `[support email]`,
        `[refund window, e.g. 7 days]`
      - `app/[locale]/(marketing)/contact/page.tsx` — `[support email]`, `[Company/Owner Name]`,
        `[business address]`
      Search for `[` in those files to be sure none are left.
- [ ] Decide the legal entity. At minimum register as a sole proprietorship
      (منشأة فردية) with a tax card; e-invoicing becomes mandatory above EGP 250k/yr
      revenue ([Wafeq](https://www.wafeq.com/en-eg/tax-and-reporting/electronic-invoice-system),
      [Deel: sole proprietorship in Egypt](https://www.deel.com/blog/sole-proprietorship-egypt)).
- [ ] **Data protection:** Egypt's PDPL executive regulations were issued Nov 2025 with
      a one-year grace period, so enforcement is roughly now; they require licences
      for data controllers, e-marketing and cross-border transfers
      ([Al Tamimi](https://www.tamimi.com/law_update_articles/from-policy-to-practice-egypt-issues-executive-regulations-of-the-personal-data-protection-law/)).
      We store names, photos, phone numbers (RSVP) and payment screenshots, hosted
      outside Egypt. Book a **one-hour consult with an Egyptian lawyer** before paid
      ads, and have them review the privacy policy and the partner agreement.
- [ ] Support email (e.g. `hello@yourdomain.com`) that forwards to a phone you check.

## I. Email (Resend)

- [ ] Create a Resend account, add `yourdomain.com`, and add the SPF/DKIM (and
      optionally DMARC) DNS records it shows. Wait for "Verified".
- [ ] Create an API key → `RESEND_API_KEY`; set `EMAIL_FROM` (§D). Redeploy.
- [ ] Test: `/ar/forgot` with your email → the reset email arrives (check spam) → the
      link works → you can log in with the new password.

## J. Monitoring & analytics

- [ ] **Sentry** (errors): create a Next.js project, copy the DSN into the † variables
      in §D, redeploy, trigger a test error if the platform stream added a route for it,
      and set an email alert for new issues.
- [ ] **Plausible** (privacy-friendly analytics, no cookie banner needed): add the site,
      set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` †. In Plausible → Site settings → Goals, add
      the custom events from `docs/MARKETING_PLAN.md` §9 (`template_view`,
      `create_started`, `publish`, `payment_submitted`, `card_opened`, `rsvp_click`,
      `share`) once the code sends them.
- [ ] **Uptime**: a free monitor (e.g. UptimeRobot / Better Stack) on
      `https://yourdomain.com/api/health` — expects `{"status":"ok"}` — alerting to your phone.

## K. Search & social presence

- [ ] **Google Search Console:** add the domain property (DNS TXT verification),
      submit `https://yourdomain.com/sitemap.xml`, request indexing for `/ar`, `/en`,
      `/ar/templates`.
- [ ] Bing Webmaster Tools: import from Search Console (2 minutes).
- [ ] Share one card link in WhatsApp to yourself and check the preview (title/image).
- [ ] Claim handles: Instagram, TikTok, Facebook page, WhatsApp Business number.

## L. End-to-end test purchase (do it on production, with real money)

- [ ] On a phone, **not logged in as admin**: register a new account → pick a **paid**
      wedding invitation → fill families, date, venue (paste a real Google Maps link),
      RSVP phone, gift details, 3 photos → Review.
- [ ] Pay 199 (or the current price) by InstaPay from a **different** account to your
      handle → upload the screenshot.
- [ ] As admin, `/ar/admin/queue`: the order appears with the proof → confirm the
      money in your bank app → Approve.
- [ ] The buyer's link unlocks. Open it on another phone (Android + iPhone if you can):
      gate opens, music starts, map opens Google Maps, RSVP opens WhatsApp to the right
      number, photos load.
- [ ] **Redeploy**, then open the link again: photos and the payment proof still load
      (proves §B).
- [ ] Reject flow: submit a second order with a wrong screenshot and reject it; the
      buyer sees the rejection.
- [ ] Refund yourself per the refund policy, to rehearse it.

## M. Launch day & first week

- [ ] Follow `launch-kit/README.md` (launch-day order) and `docs/MARKETING_PLAN.md` §6 (week plan).
- [ ] Check `/ar/admin/queue` at least every 2 hours during your published hours.
- [ ] Watch Sentry and uptime alerts; keep a notes file of every bug a user reports.
- [ ] Sunday review: funnel numbers (MARKETING_PLAN §9), what to fix, what to double.
