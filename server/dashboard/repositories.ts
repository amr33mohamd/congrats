/**
 * Repository layer for the dashboard backend. Pure data-access: every owned-row
 * query is scoped by userId (there is no Postgres RLS — authorization lives in
 * the data layer per the Foundation contract). Services compose these; route
 * handlers never touch Drizzle directly.
 *
 * All methods take an explicit `db` + `userId` so they remain trivially testable
 * and impossible to call without an ownership scope.
 */
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import type { DbClient } from '@/db';
import {
  experiences,
  steps,
  media,
  orders,
  shareLinks,
  templates,
  users,
  type Experience,
  type Step,
  type Media,
  type Order,
  type ShareLink,
  type Template,
} from '@/db/schema';

/* ───────────────────────────── Templates ──────────────────────────────── */

export async function getTemplateById(db: DbClient, id: string): Promise<Template | undefined> {
  return (await db.select().from(templates).where(eq(templates.id, id)).limit(1))[0];
}

/* ─────────────────────────────── Users ────────────────────────────────── */

/**
 * Is this account comped (`users.all_access`)? Read per request from the row,
 * never from the session, so revoking access takes effect immediately instead
 * of whenever the user's stateless JWT expires.
 */
export async function getUserAllAccess(db: DbClient, userId: string): Promise<boolean> {
  const row = await db
    .select({ allAccess: users.allAccess })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row[0]?.allAccess === true;
}

/* ──────────────────────────── Experiences ─────────────────────────────── */

export async function listExperiences(db: DbClient, userId: string): Promise<Experience[]> {
  return db
    .select()
    .from(experiences)
    .where(eq(experiences.userId, userId))
    .orderBy(desc(experiences.updatedAt));
}

/** Owner-scoped single fetch — returns undefined if missing OR not owned. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getOwnedExperience(
  db: DbClient,
  userId: string,
  id: string,
): Promise<Experience | undefined> {
  // A malformed id is simply "not yours / not found". Passed to Postgres it
  // failed the uuid cast and surfaced as a 500.
  if (!UUID.test(id)) return undefined;
  return (
    await db
      .select()
      .from(experiences)
      .where(and(eq(experiences.id, id), eq(experiences.userId, userId)))
      .limit(1)
  )[0];
}

export async function insertExperience(
  db: DbClient,
  values: typeof experiences.$inferInsert,
): Promise<Experience> {
  return (await db.insert(experiences).values(values).returning())[0];
}

export async function updateOwnedExperience(
  db: DbClient,
  userId: string,
  id: string,
  patch: Partial<typeof experiences.$inferInsert>,
): Promise<Experience | undefined> {
  return (
    await db
      .update(experiences)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(experiences.id, id), eq(experiences.userId, userId)))
      .returning()
  )[0];
}

export async function deleteOwnedExperience(
  db: DbClient,
  userId: string,
  id: string,
): Promise<boolean> {
  const rows = await db
    .delete(experiences)
    .where(and(eq(experiences.id, id), eq(experiences.userId, userId)))
    .returning({ id: experiences.id });
  return rows.length > 0;
}

/* ─────────────────────────────── Steps ────────────────────────────────── */

export async function listSteps(db: DbClient, experienceId: string): Promise<Step[]> {
  return db
    .select()
    .from(steps)
    .where(eq(steps.experienceId, experienceId))
    .orderBy(steps.orderIndex);
}

export async function replaceSteps(
  db: DbClient,
  experienceId: string,
  rows: Array<typeof steps.$inferInsert>,
): Promise<Step[]> {
  // Bulk upsert semantics = full replace of the experience's step set. The
  // experience ownership is already verified by the caller, and steps cascade
  // from the experience, so deleting by experienceId is safe + scoped.
  await db.delete(steps).where(eq(steps.experienceId, experienceId));
  if (rows.length === 0) return [];
  return db.insert(steps).values(rows).returning();
}

/**
 * Apply a reconciliation plan without replacing rows: existing steps keep their
 * UUIDs (legacy media rows bind by `step_id`, and a replace would null those
 * out), so we only move order indexes and insert the missing scenes.
 *
 * Runs in a transaction and moves every row through a negative scratch index
 * first — the (experience_id, order_index) unique key would otherwise reject
 * swaps. The caller has already verified ownership of the experience.
 */
export async function applyStepPlan(
  db: DbClient,
  experienceId: string,
  plan: {
    moves: Array<{ id: string; orderIndex: number }>;
    inserts: Array<typeof steps.$inferInsert>;
    /** Text rewritten by slot-level reconciliation (renamed/stale keys). */
    texts?: Array<{ id: string; textContent: Record<string, string> }>;
  },
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const t of plan.texts ?? []) {
      await tx
        .update(steps)
        .set({ textContent: t.textContent, updatedAt: new Date() })
        .where(and(eq(steps.id, t.id), eq(steps.experienceId, experienceId)));
    }
    for (let i = 0; i < plan.moves.length; i++) {
      await tx
        .update(steps)
        .set({ orderIndex: -1 - i })
        .where(and(eq(steps.id, plan.moves[i].id), eq(steps.experienceId, experienceId)));
    }
    for (const move of plan.moves) {
      await tx
        .update(steps)
        .set({ orderIndex: move.orderIndex, updatedAt: new Date() })
        .where(and(eq(steps.id, move.id), eq(steps.experienceId, experienceId)));
    }
    if (plan.inserts.length > 0) await tx.insert(steps).values(plan.inserts);
  });
}

/* ─────────────────────────────── Media ────────────────────────────────── */

export async function insertMedia(
  db: DbClient,
  values: typeof media.$inferInsert,
): Promise<Media> {
  return (await db.insert(media).values(values).returning())[0];
}

export async function getOwnedMedia(
  db: DbClient,
  userId: string,
  id: string,
): Promise<Media | undefined> {
  return (
    await db
      .select()
      .from(media)
      .where(and(eq(media.id, id), eq(media.userId, userId)))
      .limit(1)
  )[0];
}

export async function deleteOwnedMedia(
  db: DbClient,
  userId: string,
  id: string,
): Promise<Media | undefined> {
  return (
    await db
      .delete(media)
      .where(and(eq(media.id, id), eq(media.userId, userId)))
      .returning()
  )[0];
}

export async function listExperienceMedia(
  db: DbClient,
  userId: string,
  experienceId: string,
): Promise<Media[]> {
  return db
    .select()
    .from(media)
    .where(and(eq(media.userId, userId), eq(media.experienceId, experienceId)));
}

/* ─────────────────────────────── Orders ───────────────────────────────── */

export async function getOwnedOrder(
  db: DbClient,
  userId: string,
  id: string,
): Promise<Order | undefined> {
  return (
    await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, userId)))
      .limit(1)
  )[0];
}

export async function findReusableOrder(
  db: DbClient,
  userId: string,
  experienceId: string,
): Promise<Order | undefined> {
  // A still-actionable order for this experience (pending = awaiting payment,
  // submitted = under review). Approved means already unlocked; rejected →
  // retry needs a NEW order per the state machine.
  return (
    await db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.experienceId, experienceId)))
      .orderBy(desc(orders.createdAt))
      .limit(1)
  )[0];
}

export async function insertOrder(
  db: DbClient,
  values: typeof orders.$inferInsert,
): Promise<Order> {
  return (await db.insert(orders).values(values).returning())[0];
}

/**
 * The user's OTHER payment screenshots (everything except `excludeId`) — used to
 * detect a recycled payment proof via content hashing.
 */
export async function listOtherPaymentScreenshots(
  db: DbClient,
  userId: string,
  excludeId: string,
): Promise<Array<{ id: string; bucket: string; storagePath: string }>> {
  return db
    .select({ id: media.id, bucket: media.bucket, storagePath: media.storagePath })
    .from(media)
    .where(
      and(
        eq(media.userId, userId),
        eq(media.kind, 'payment_screenshot'),
        ne(media.id, excludeId),
      ),
    );
}

/* ───────────────────────────── Share links ────────────────────────────── */

export async function getShareLinkByExperience(
  db: DbClient,
  experienceId: string,
): Promise<ShareLink | undefined> {
  return (
    await db.select().from(shareLinks).where(eq(shareLinks.experienceId, experienceId)).limit(1)
  )[0];
}

export async function getShareLinkBySlug(
  db: DbClient,
  slug: string,
): Promise<ShareLink | undefined> {
  return (await db.select().from(shareLinks).where(eq(shareLinks.slug, slug)).limit(1))[0];
}

/** All share links for a set of experiences (used to attach slugs to a list). */
export async function listShareLinksForExperiences(
  db: DbClient,
  experienceIds: string[],
): Promise<ShareLink[]> {
  if (experienceIds.length === 0) return [];
  return db.select().from(shareLinks).where(inArray(shareLinks.experienceId, experienceIds));
}

export async function insertShareLink(
  db: DbClient,
  values: typeof shareLinks.$inferInsert,
): Promise<ShareLink> {
  return (await db.insert(shareLinks).values(values).returning())[0];
}
