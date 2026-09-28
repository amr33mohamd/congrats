#!/bin/sh
# Bootstraps secrets + database, then hands off to the given command (default: next start).
#
#  - No DATABASE_URL  → in-process PGlite. The seed bootstraps the schema (via
#    getDb → ensurePgliteSchema) and the catalog. Fully offline. The app refuses
#    to boot this way in production unless ALLOW_PGLITE_IN_PRODUCTION=true.
#  - DATABASE_URL set → external Postgres. Apply versioned migrations, then seed.
set -e

DATA_DIR="${PGLITE_PATH%/pglite}"
[ "$DATA_DIR" = "$PGLITE_PATH" ] && DATA_DIR="/app/.data"
mkdir -p "$DATA_DIR" 2>/dev/null || true

# ── Public URL ──────────────────────────────────────────────────────────────
# AUTH_URL is required at boot (lib/env.ts). On platforms that tell us our own
# URL, default to it so the very first deploy comes up before the operator has
# had a chance to set a custom domain. An explicit AUTH_URL always wins.
if [ -z "$AUTH_URL" ]; then
  if [ -n "$RENDER_EXTERNAL_URL" ]; then
    AUTH_URL="$RENDER_EXTERNAL_URL"
  elif [ -n "$FLY_APP_NAME" ]; then
    AUTH_URL="https://$FLY_APP_NAME.fly.dev"
  fi
  [ -n "$AUTH_URL" ] && export AUTH_URL && echo "→ AUTH_URL not set — using platform URL $AUTH_URL"
fi

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
  # Databases created by older images were set up with `drizzle-kit push`
  # (the migrations folder was not shipped), so they have tables but no
  # migration history — `migrate` would then fail replaying 0000_init.
  # Detect that once: bring the schema up to date with push, then record the
  # latest migration as applied so every later boot uses plain `migrate`.
  DB_STATE="$(node -e "
    const postgres = require('postgres');
    const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
    sql\`select to_regclass('drizzle.__drizzle_migrations') is not null as tracked,
               to_regclass('public.users') is not null as populated\`
      .then(([r]) => { console.log(r.tracked ? 'tracked' : r.populated ? 'untracked' : 'empty'); return sql.end(); })
      .catch((e) => { console.error(e.message); process.exit(1); });
  ")"
  if [ "$DB_STATE" = "untracked" ]; then
    echo "→ Existing schema without migration history — syncing with push, then baselining."
    npm run db:push
    node -e "
      const fs = require('fs'), crypto = require('crypto'), postgres = require('postgres');
      const journal = JSON.parse(fs.readFileSync('drizzle/meta/_journal.json', 'utf8'));
      const last = journal.entries[journal.entries.length - 1];
      const hash = crypto.createHash('sha256').update(fs.readFileSync('drizzle/' + last.tag + '.sql', 'utf8')).digest('hex');
      const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
      (async () => {
        await sql\`create schema if not exists drizzle\`;
        await sql\`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)\`;
        await sql\`insert into drizzle.__drizzle_migrations (hash, created_at) values (\${hash}, \${last.when})\`;
        await sql.end();
        console.log('  baselined at ' + last.tag);
      })().catch((e) => { console.error(e.message); process.exit(1); });
    "
  fi
  npm run db:migrate
fi

echo "→ Seeding catalog + admin (idempotent)..."
npm run db:seed

echo "→ Starting app..."
exec "$@"
