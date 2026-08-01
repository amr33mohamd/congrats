#!/bin/sh
# Bootstraps secrets + database, then hands off to the given command (default: next start).
#
#  - No DATABASE_URL  → in-process PGlite. The seed bootstraps the schema (via
#    getDb → ensurePgliteSchema) and the catalog. Fully offline.
#  - DATABASE_URL set → external Postgres (compose `postgres` profile). Apply the
#    schema, then seed.
set -e

DATA_DIR="${PGLITE_PATH%/pglite}"
[ "$DATA_DIR" = "$PGLITE_PATH" ] && DATA_DIR="/app/.data"
mkdir -p "$DATA_DIR" 2>/dev/null || true

# ── Secrets: never run with a known/committed secret ────────────────────────
# If AUTH_SECRET is missing or still a placeholder, generate a strong random one
# and persist it to the data volume so sessions survive restarts. For multi-node
# production, set AUTH_SECRET explicitly (a shared value across instances).
case "$AUTH_SECRET" in
  ""|*change-me*|*build-time-placeholder*)
    SECRET_FILE="$DATA_DIR/.auth_secret"
    if [ -f "$SECRET_FILE" ]; then
      AUTH_SECRET="$(cat "$SECRET_FILE")"
    else
      AUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
      printf '%s' "$AUTH_SECRET" > "$SECRET_FILE"
      echo "⚠ Generated a random AUTH_SECRET (persisted to the data volume)."
      echo "  For multi-instance production, set AUTH_SECRET explicitly instead."
    fi
    export AUTH_SECRET
    ;;
esac

# If no admin password was provided, generate one and print it ONCE so the
# operator can sign in — never fall back to a known default.
if [ -z "$SEED_ADMIN_PASSWORD" ]; then
  PW_FILE="$DATA_DIR/.admin_password"
  if [ -f "$PW_FILE" ]; then
    SEED_ADMIN_PASSWORD="$(cat "$PW_FILE")"
  else
    SEED_ADMIN_PASSWORD="$(node -e "console.log(require('crypto').randomBytes(9).toString('base64url'))")"
    printf '%s' "$SEED_ADMIN_PASSWORD" > "$PW_FILE"
    echo "──────────────────────────────────────────────────────────────"
    echo "  Seeded admin: ${SEED_ADMIN_EMAIL:-admin@congrats.dev}"
    echo "  Generated admin password: $SEED_ADMIN_PASSWORD"
    echo "  (shown once — set SEED_ADMIN_PASSWORD to choose your own)"
    echo "──────────────────────────────────────────────────────────────"
  fi
  export SEED_ADMIN_PASSWORD
fi

if [ -n "$DATABASE_URL" ]; then
  echo "→ DATABASE_URL detected — applying schema to Postgres..."
  # Prefer versioned migrations when present; fall back to push otherwise.
  if [ -d "drizzle" ] && ls drizzle/*.sql >/dev/null 2>&1; then
    npm run db:migrate
  else
    npm run db:push
  fi
fi

echo "→ Seeding catalog + admin (idempotent)..."
npm run db:seed

echo "→ Starting app..."
exec "$@"
