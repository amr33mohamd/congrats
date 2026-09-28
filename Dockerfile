# syntax=docker/dockerfile:1

# ── base ─────────────────────────────────────────────────────────────────────
FROM node:22-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── deps: install all deps (dev included — needed for `next build`, the tsx
#         seed script, and drizzle-kit push at runtime) ─────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── build: compile the Next.js app ───────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build does not connect to a database. A placeholder AUTH_SECRET (set only
# for the build command below, so it never lands in the image config) keeps
# Auth.js happy during static analysis; lib/env.ts skips validation during the
# build and rejects this placeholder at runtime.
ENV NODE_ENV=production
# Build-time configuration: NEXT_PUBLIC_* values are inlined into the browser
# bundle and the CSP header is written into the build manifest, so they must be
# known here, not only at runtime. All optional — empty means "feature off".
# (Render/Fly pass same-named env vars / [build.args] as build args.)
ARG NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""
ARG NEXT_PUBLIC_PLAUSIBLE_HOST=""
ARG NEXT_PUBLIC_COMPANY_NAME=""
ARG NEXT_PUBLIC_SUPPORT_EMAIL=""
ARG NEXT_PUBLIC_BUSINESS_ADDRESS=""
ARG NEXT_PUBLIC_SUPPORT_WHATSAPP=""
ARG NEXT_PUBLIC_SITE_URL=""
ARG SENTRY_DSN=""
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT=""
ARG SENTRY_ORG=""
ARG SENTRY_PROJECT=""
ARG CSP_ENFORCE=""
ENV NEXT_PUBLIC_PLAUSIBLE_DOMAIN=$NEXT_PUBLIC_PLAUSIBLE_DOMAIN \
    NEXT_PUBLIC_PLAUSIBLE_HOST=$NEXT_PUBLIC_PLAUSIBLE_HOST \
    NEXT_PUBLIC_COMPANY_NAME=$NEXT_PUBLIC_COMPANY_NAME \
    NEXT_PUBLIC_SUPPORT_EMAIL=$NEXT_PUBLIC_SUPPORT_EMAIL \
    NEXT_PUBLIC_BUSINESS_ADDRESS=$NEXT_PUBLIC_BUSINESS_ADDRESS \
    NEXT_PUBLIC_SUPPORT_WHATSAPP=$NEXT_PUBLIC_SUPPORT_WHATSAPP \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    SENTRY_DSN=$SENTRY_DSN \
    NEXT_PUBLIC_SENTRY_ENVIRONMENT=$NEXT_PUBLIC_SENTRY_ENVIRONMENT \
    SENTRY_ORG=$SENTRY_ORG \
    SENTRY_PROJECT=$SENTRY_PROJECT \
    CSP_ENFORCE=$CSP_ENFORCE
# The Sentry auth token (source-map upload) is a secret, so it comes in as a
# BuildKit secret instead of an ARG (ARGs are visible in the image history):
#   docker build --secret id=sentry_auth_token,env=SENTRY_AUTH_TOKEN .
# Without it, source maps are simply not uploaded.
RUN --mount=type=secret,id=sentry_auth_token,required=false \
    if [ -f /run/secrets/sentry_auth_token ]; then \
      export SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)"; \
    fi; \
    AUTH_SECRET=build-time-placeholder npm run build

# ── runner: production image ─────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Writable HOME for the non-root user (drizzle-kit writes under ~/.local).
ENV HOME=/tmp

# Full app tree (node_modules, .next, source) so we can run the seed (tsx) and
# `next start` at runtime.
COPY --from=build /app ./

# Non-root user + a data dir for PGlite + local uploads (mount a volume here).
# `.next` must be writable too — Next.js writes ISR/prerender cache there at runtime.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs \
 && mkdir -p /app/.data \
 && chown -R nextjs:nodejs /app/.data /app/.next

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

# Liveness/readiness probe (Node 22 has global fetch; no curl needed).
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
# Exec next directly (not via npm) so SIGTERM from the orchestrator reaches the
# server and it shuts down cleanly instead of npm logging a SIGTERM failure.
CMD ["./node_modules/.bin/next", "start"]
