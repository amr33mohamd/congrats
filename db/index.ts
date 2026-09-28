/**
 * DB client. Uses in-process PGlite for local/dev/test (offline, no network) and
 * postgres-js → Neon Postgres when DATABASE_URL is set.
 *
 * Both paths expose the same `db` (drizzle) API and the same `schema`.
 * The client is memoized on globalThis to survive Next.js HMR / serverless reuse.
 */
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { schema } from './schema';

// Concrete, fully-typed drizzle client. Both the PGlite (dev/test) and the
// postgres-js (Neon/prod) drivers expose the identical drizzle query API over
// the same `schema`, so a single type serves both and keeps queries typed.
export type DbClient = PgliteDatabase<typeof schema>;

type Cached = {
  db: DbClient;
  // For PGlite we keep a handle so seed/tests can run raw SQL + push the schema.
  raw: unknown;
  driver: 'pglite' | 'neon';
};

const globalForDb = globalThis as unknown as { __congratsDb?: Promise<Cached> };

async function create(): Promise<Cached> {
  const url = process.env.DATABASE_URL;

  if (url) {
    // ── Production / Neon ────────────────────────────────────────────────
    const postgres = (await import('postgres')).default;
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const client = postgres(url, { prepare: false });
    const db = drizzle(client, { schema });
    return { db: db as unknown as DbClient, raw: client, driver: 'neon' as const };
  }

  // ── Local / dev / test → PGlite (in-process Postgres) ──────────────────
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');

  const dataDir = process.env.PGLITE_PATH ?? '.data/pglite';
  const pg = dataDir === 'memory://' ? new PGlite() : new PGlite(dataDir);
  const db = drizzle(pg, { schema });

  // Ensure tables exist for the in-process database. drizzle-kit `db:push`
  // targets a real Postgres; for PGlite we create the schema idempotently here.
  await ensurePgliteSchema(pg);

  return { db: db as DbClient, raw: pg, driver: 'pglite' as const };
}

export function getDb(): Promise<DbClient> {
  if (!globalForDb.__congratsDb) {
    globalForDb.__congratsDb = create();
  }
  return globalForDb.__congratsDb.then((c) => c.db);
}

export function getDbContext(): Promise<Cached> {
  if (!globalForDb.__congratsDb) {
    globalForDb.__congratsDb = create();
  }
  return globalForDb.__congratsDb;
}

/**
 * Idempotent DDL for PGlite (dev/test). Mirrors db/schema.ts. In production the
 * schema is managed by `npm run db:push` (drizzle-kit) against Neon instead.
 */
async function ensurePgliteSchema(pg: { exec: (sql: string) => Promise<unknown> }) {
  // gen_random_uuid() is available in pg core (PGlite ≥ pg13) — no pgcrypto needed.
  await pg.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      password_hash text,
      display_name text,
      locale text NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar','en')),
      avatar_url text,
      is_blocked boolean NOT NULL DEFAULT false,
      all_access boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      role text NOT NULL CHECK (role IN ('reviewer','admin','superadmin')),
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug text NOT NULL UNIQUE,
      name_en text NOT NULL,
      name_ar text NOT NULL,
      icon text,
      sort_order integer NOT NULL DEFAULT 0,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS templates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
      slug text NOT NULL UNIQUE,
      title_en text,
      title_ar text,
      locale text NOT NULL CHECK (locale IN ('ar','en')),
      direction text NOT NULL CHECK (direction IN ('rtl','ltr')),
      is_paid boolean NOT NULL DEFAULT false,
      price_piastres integer NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'EGP',
      thumbnail_url text,
      preview_link text,
      definition jsonb NOT NULL,
      status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
      created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      template_id uuid NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
      title text,
      recipient_name text,
      locale text NOT NULL CHECK (locale IN ('ar','en')),
      direction text NOT NULL CHECK (direction IN ('rtl','ltr')),
      status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','awaiting_payment','locked','published')),
      is_unlocked boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS steps (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      experience_id uuid NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
      template_step_id text NOT NULL,
      order_index integer NOT NULL,
      recipient_name text,
      text_content jsonb,
      animation_config jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (experience_id, order_index)
    );

    CREATE TABLE IF NOT EXISTS media (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experience_id uuid REFERENCES experiences(id) ON DELETE CASCADE,
      step_id uuid REFERENCES steps(id) ON DELETE SET NULL,
      template_step_id text,
      slot_key text,
      kind text NOT NULL CHECK (kind IN ('step_image','payment_screenshot','thumbnail')),
      storage_path text NOT NULL,
      bucket text NOT NULL CHECK (bucket IN ('experience-media','payment-proofs')),
      mime_type text,
      width integer,
      height integer,
      bytes integer,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experience_id uuid NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
      template_id uuid NOT NULL REFERENCES templates(id) ON DELETE RESTRICT,
      amount_piastres integer NOT NULL,
      currency text NOT NULL DEFAULT 'EGP',
      order_ref text NOT NULL UNIQUE,
      instapay_handle text,
      status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','submitted','approved','rejected','refunded')),
      payment_ref text,
      screenshot_media_id uuid REFERENCES media(id) ON DELETE SET NULL,
      reviewed_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
      reviewed_at timestamptz,
      reject_reason text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS share_links (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      experience_id uuid NOT NULL UNIQUE REFERENCES experiences(id) ON DELETE CASCADE,
      slug text NOT NULL UNIQUE,
      visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','unlisted','disabled')),
      expires_at timestamptz,
      view_count integer NOT NULL DEFAULT 0,
      last_viewed_at timestamptz,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id uuid,
      actor_type text CHECK (actor_type IN ('user','admin','system')),
      action text NOT NULL,
      entity_type text,
      entity_id uuid,
      metadata jsonb,
      ip text,
      user_agent text,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash text NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      used_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  // ── Idempotent migrations ───────────────────────────────────────────
  // `CREATE TABLE IF NOT EXISTS` never alters an already-existing table, so
  // columns added after a DB was first created must be back-filled here.
  // Each statement is individually guarded with IF NOT EXISTS so it is safe to
  // re-run on every boot, including against a fresh database.
  await pg.exec(/* sql */ `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS all_access boolean NOT NULL DEFAULT false;
  `);
}

export { schema };
