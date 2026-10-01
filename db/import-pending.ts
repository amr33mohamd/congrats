/**
 * Build-time card import (runs after the seed in `vercel-build`).
 *
 * CARDS_IMPORT holds a gzip+base64 `congrats-cards/v1` bundle (db/export-cards.ts).
 * It is imported into the SEED_ADMIN_EMAIL account once that account exists —
 * until the owner signs up, this logs and waits for the next deploy. Card
 * content only, never accounts or passwords; re-running skips cards already
 * imported, so the variable can stay set.
 */
import { gunzipSync } from 'node:zlib';
import { eq } from 'drizzle-orm';
import { getDb } from './index';
import { users } from './schema';
import { ImportBundleSchema, importCards } from '@/server/admin/import-service';

async function main() {
  const packed = process.env.CARDS_IMPORT?.trim();
  if (!packed) return;
  const owner = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (!owner) {
    console.warn('[import] CARDS_IMPORT is set but SEED_ADMIN_EMAIL is not — nothing to import into.');
    return;
  }
  const bundle = ImportBundleSchema.parse(JSON.parse(gunzipSync(Buffer.from(packed, 'base64')).toString('utf8')));
  const db = await getDb();
  const user = (await db.select({ id: users.id }).from(users).where(eq(users.email, owner)).limit(1))[0];
  if (!user) {
    console.warn(`[import] ${owner} has not signed up yet — ${bundle.cards.length} cards wait for the next deploy.`);
    return;
  }
  const result = await importCards(db, { userId: user.id }, bundle);
  console.log('[import]', JSON.stringify(result));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    // Never block a deploy on an import problem; the site matters more.
    console.error('[import] failed:', err);
    process.exit(0);
  });
