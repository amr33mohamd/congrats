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
# The build does not connect to a database. A placeholder secret keeps Auth.js
# happy during static analysis.
ENV NODE_ENV=production
ENV AUTH_SECRET=build-time-placeholder
RUN npm run build

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
CMD ["npm", "run", "start"]
