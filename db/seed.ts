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
import { and, eq, notInArray } from 'drizzle-orm';
import { getDb } from './index';
import { categories, templates, users, adminUsers } from './schema';
import { TEMPLATE_CATALOG, CATALOG_CATEGORIES } from '@/content/templates';
import { hashPassword } from '@/lib/password';

async function upsertCategory(db: Awaited<ReturnType<typeof getDb>>, c: (typeof CATALOG_CATEGORIES)[number]) {
  const existing = await db.select().from(categories).where(eq(categories.slug, c.slug)).limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(categories).values(c).returning();
  return row;
}

/**
 * Retire published templates the catalog no longer ships (e.g. the invitation
 * rewrite replaced whole slugs). Archived, never deleted: experiences hold an
 * FK to their template and must keep rendering — archiving only removes the
 * template from the gallery/picker. Idempotent: already-archived rows are left
 * alone, so a re-seed reports 0.
 *
 * NB: this would also archive published templates an admin created in the
 * admin UI (they are not in the catalog either), and the seed runs on EVERY
 * container boot. It is therefore OPT-IN: it only runs when
 * SEED_ARCHIVE_UNLISTED=1 (a deliberate one-off after retiring catalog slugs).
 */
export async function archiveUnlistedTemplates(
  db: Awaited<ReturnType<typeof getDb>>,
  catalogSlugs: readonly string[],
): Promise<string[]> {
  // An empty catalog would archive everything — refuse rather than wipe the shop.
  if (catalogSlugs.length === 0) return [];
  const rows = await db
    .update(templates)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(and(eq(templates.status, 'published'), notInArray(templates.slug, [...catalogSlugs])))
    .returning({ slug: templates.slug });
  return rows.map((r) => r.slug).sort();
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
  // The fallback password is in this public repo: fine on a laptop, an open
  // door on a real site. Production must supply its own.
  const inProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  // No admin until the owner configures one (SEED_ADMIN_EMAIL + _PASSWORD and
  // redeploy). Templates still need a createdBy, which stays null.
  const skipAdmin = inProduction && !(process.env.SEED_ADMIN_PASSWORD && process.env.SEED_ADMIN_EMAIL);
  if (skipAdmin)
    console.warn('[seed] SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set — no admin account created.');
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'congrats-admin';
  let admin: typeof users.$inferSelect | undefined;
  if (!skipAdmin) {
    const adminHash = await hashPassword(adminPassword);
    admin = (await db.select().from(users).where(eq(users.email, adminEmail)).limit(1))[0];
    if (!admin) {
      [admin] = await db
        .insert(users)
        .values({
          email: adminEmail,
          passwordHash: adminHash,
          displayName: 'Demo Admin',
          locale: 'ar',
        })
        .returning();
    } else if (!admin.passwordHash) {
      // Back-fill a password for admins created before password auth existed.
      [admin] = await db
        .update(users)
        .set({ passwordHash: adminHash })
        .where(eq(users.id, admin.id))
        .returning();
    }
  }
  // Comped QA account: an ordinary (non-admin) user with `all_access`, so the
  // full buyer journey can be walked on PAID templates without an InstaPay
  // transfer. Opt in explicitly — it is skipped unless SEED_TESTER is set, so a
  // production seed never quietly creates a free-everything login.
  if (process.env.SEED_TESTER === '1') {
    const testerEmail = (process.env.SEED_TESTER_EMAIL ?? 'tester@congrats.dev').toLowerCase();
    const testerPassword = process.env.SEED_TESTER_PASSWORD ?? 'congrats-tester';
    const testerHash = await hashPassword(testerPassword);
    const existingTester = (await db.select().from(users).where(eq(users.email, testerEmail)).limit(1))[0];
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

  let adminRow = admin
    ? (await db.select().from(adminUsers).where(eq(adminUsers.userId, admin.id)).limit(1))[0]
    : undefined;
  if (admin && !adminRow) {
    [adminRow] = await db.insert(adminUsers).values({ userId: admin.id, role: 'superadmin' }).returning();
  }

  // Templates — upsert on slug. New rows are inserted with the catalog's
  // pricing + status. Existing rows only get their CODE-owned content
  // (definition, thumbnail, titles, category, locale) refreshed so catalog
  // edits flow in on re-seed. Pricing (isPaid/pricePiastres/currency) and
  // status are ADMIN-owned once a row exists: the seed runs on every boot and
  // must not revert a price change or un-archive a template made in the admin
  // UI. Identity columns (id, created_by) and user data are never touched.
  let inserted = 0;
  let updated = 0;
  for (const t of TEMPLATE_CATALOG) {
    const existing = await db
      .select({ id: templates.id })
      .from(templates)
      .where(eq(templates.slug, t.slug))
      .limit(1);
    const contentFields = {
      categoryId: catRows[t.category] ?? null,
      titleEn: t.titleEn,
      titleAr: t.titleAr,
      locale: t.locale,
      direction: t.direction,
      thumbnailUrl: t.thumbnailUrl ?? null,
      definition: t.definition,
    };
    const fields = {
      ...contentFields,
      isPaid: t.isPaid,
      pricePiastres: t.pricePiastres,
      currency: t.currency,
      status: 'published' as const,
    };
    if (existing[0]) {
      await db
        .update(templates)
        .set({ ...contentFields, updatedAt: new Date() })
        .where(eq(templates.id, existing[0].id));
      updated += 1;
    } else {
      await db.insert(templates).values({ slug: t.slug, ...fields, createdBy: adminRow?.id ?? null });
      inserted += 1;
    }
  }

  const archived =
    process.env.SEED_ARCHIVE_UNLISTED !== '1'
      ? []
      : await archiveUnlistedTemplates(
          db,
          TEMPLATE_CATALOG.map((t) => t.slug),
        );
  if (archived.length > 0) {
    console.log(`Seed: archived ${archived.length} template(s) no longer in the catalog:`, archived);
  }

  return {
    categories: Object.keys(catRows).length,
    admin: admin?.email ?? null,
    templatesInCatalog: TEMPLATE_CATALOG.length,
    templatesInserted: inserted,
    templatesUpdated: updated,
    templatesArchived: archived.length,
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
