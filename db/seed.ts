/**
 * Seed: full occasion catalog (8 categories + 16 AR/EN templates) + a demo admin
 * user. Idempotent on slug/email. Run with: npm run db:seed
 *
 * Templates come from the validated content/templates catalog (TEMPLATE_CATALOG),
 * whose definitions are parsed against lib/template-contract at module load, so an
 * invalid template throws here before anything is inserted. The two original seed
 * slugs (anniversary-our-story-en, eid-blessings-ar) are part of the catalog and
 * keep their exact slug/title/price, so existing rows do not churn.
 *
 * Uses the same db client (PGlite locally).
 */
import { eq } from 'drizzle-orm';
import { getDb } from './index';
import { categories, templates, users, adminUsers } from './schema';
import { TEMPLATE_CATALOG, CATALOG_CATEGORIES } from '@/content/templates';
import { hashPassword } from '@/lib/password';

async function upsertCategory(
  db: Awaited<ReturnType<typeof getDb>>,
  c: (typeof CATALOG_CATEGORIES)[number],
) {
  const existing = await db.select().from(categories).where(eq(categories.slug, c.slug)).limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(categories).values(c).returning();
  return row;
}

export async function seed() {
  const db = await getDb();

  // Categories (upsert all 8 catalog categories first → slug -> id map).
  const catRows: Record<string, string> = {};
  for (const c of CATALOG_CATEGORIES) {
    const row = await upsertCategory(db, c);
    catRows[c.slug] = row.id;
  }

  // Demo admin user (+ admin_users row for createdBy FK). Seeded with a password
  // so it can sign in via the email+password provider. Override via env in prod.
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@congrats.dev').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'congrats-admin';
  const adminHash = await hashPassword(adminPassword);
  let admin = (await db.select().from(users).where(eq(users.email, adminEmail)).limit(1))[0];
  if (!admin) {
    [admin] = await db
      .insert(users)
      .values({ email: adminEmail, passwordHash: adminHash, displayName: 'Demo Admin', locale: 'ar' })
      .returning();
  } else if (!admin.passwordHash) {
    // Back-fill a password for admins created before password auth existed.
    [admin] = await db
      .update(users)
      .set({ passwordHash: adminHash })
      .where(eq(users.id, admin.id))
      .returning();
  }
  // Comped QA account: an ordinary (non-admin) user with `all_access`, so the
  // full buyer journey can be walked on PAID templates without an InstaPay
  // transfer. Opt in explicitly — it is skipped unless SEED_TESTER is set, so a
  // production seed never quietly creates a free-everything login.
  if (process.env.SEED_TESTER === '1') {
    const testerEmail = (process.env.SEED_TESTER_EMAIL ?? 'tester@congrats.dev').toLowerCase();
    const testerPassword = process.env.SEED_TESTER_PASSWORD ?? 'congrats-tester';
    const testerHash = await hashPassword(testerPassword);
    const existingTester = (
      await db.select().from(users).where(eq(users.email, testerEmail)).limit(1)
    )[0];
    if (!existingTester) {
      await db.insert(users).values({
        email: testerEmail,
        passwordHash: testerHash,
        displayName: 'QA Tester',
        locale: 'ar',
        allAccess: true,
      });
    } else {
      // Re-running the seed re-arms the flag and the password.
      await db
        .update(users)
        .set({ allAccess: true, passwordHash: testerHash })
        .where(eq(users.id, existingTester.id));
    }
  }

  let adminRow = (await db.select().from(adminUsers).where(eq(adminUsers.userId, admin.id)).limit(1))[0];
  if (!adminRow) {
    [adminRow] = await db.insert(adminUsers).values({ userId: admin.id, role: 'superadmin' }).returning();
  }

  // Templates — upsert on slug. New rows are inserted; existing rows have their
  // catalog-owned fields (definition, thumbnail, titles, pricing) refreshed so
  // edits to the content catalog flow into the DB on re-seed. Identity columns
  // (id, created_by) and user data are never touched.
  let inserted = 0;
  let updated = 0;
  for (const t of TEMPLATE_CATALOG) {
    const existing = await db.select({ id: templates.id }).from(templates).where(eq(templates.slug, t.slug)).limit(1);
    const fields = {
      categoryId: catRows[t.category] ?? null,
      titleEn: t.titleEn,
      titleAr: t.titleAr,
      locale: t.locale,
      direction: t.direction,
      isPaid: t.isPaid,
      pricePiastres: t.pricePiastres,
      currency: t.currency,
      thumbnailUrl: t.thumbnailUrl ?? null,
      definition: t.definition,
      status: 'published' as const,
    };
    if (existing[0]) {
      await db.update(templates).set({ ...fields, updatedAt: new Date() }).where(eq(templates.id, existing[0].id));
      updated += 1;
    } else {
      await db.insert(templates).values({ slug: t.slug, ...fields, createdBy: adminRow.id });
      inserted += 1;
    }
  }

  return {
    categories: Object.keys(catRows).length,
    admin: admin.email,
    templatesInCatalog: TEMPLATE_CATALOG.length,
    templatesInserted: inserted,
    templatesUpdated: updated,
  };
}

// Allow running directly: `npm run db:seed`.
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  seed()
    .then((r) => {
      console.log('Seed complete:', r);
      process.exit(0);
    })
    .catch((e) => {
      console.error('Seed failed:', e);
      process.exit(1);
    });
}
