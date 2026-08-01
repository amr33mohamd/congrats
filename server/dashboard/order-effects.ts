/**
 * DB-backed `OrderEffects` adapter for the dashboard backend. The order state
 * machine (`lib/orders/state-machine.ts`) is pure and delegates every side
 * effect here. B1 only ever drives the `submit` action, but the adapter
 * implements the full interface so it stays a faithful, reusable effects sink.
 *
 * IMPORTANT: unlock / share-link activation are NEVER set by B1 directly — they
 * happen only through `transitionOrder` (i.e. on admin approve/refund). For the
 * user `submit` path these effect methods simply persist the order + audit row.
 */
import { and, eq } from 'drizzle-orm';
import type { DbClient } from '@/db';
import { orders, experiences, shareLinks, auditLog } from '@/db/schema';
import type { OrderEffects } from '@/lib/orders/state-machine';

export function makeOrderEffects(db: DbClient): OrderEffects {
  return {
    async persistOrder(orderId, patch) {
      // Conditional on the expected current status → optimistic concurrency.
      const updated = await db
        .update(orders)
        .set({
          status: patch.status,
          ...(patch.paymentRef !== undefined ? { paymentRef: patch.paymentRef } : {}),
          ...(patch.screenshotMediaId !== undefined
            ? { screenshotMediaId: patch.screenshotMediaId }
            : {}),
          ...(patch.rejectReason !== undefined ? { rejectReason: patch.rejectReason } : {}),
          ...(patch.reviewedBy !== undefined ? { reviewedBy: patch.reviewedBy } : {}),
          ...(patch.reviewedAt !== undefined ? { reviewedAt: patch.reviewedAt } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(orders.id, orderId), eq(orders.status, patch.expectedFrom)))
        .returning({ id: orders.id });
      return updated.length > 0;
    },

    async setExperienceUnlocked(experienceId, unlocked) {
      await db
        .update(experiences)
        .set({
          isUnlocked: unlocked,
          status: unlocked ? 'published' : 'locked',
          updatedAt: new Date(),
        })
        .where(eq(experiences.id, experienceId));
    },

    async setShareLinkActive(experienceId, active) {
      await db
        .update(shareLinks)
        .set({ isActive: active })
        .where(eq(shareLinks.experienceId, experienceId));
    },

    async appendAudit(entry) {
      await db.insert(auditLog).values({
        actorId: entry.actorId ?? null,
        actorType: entry.actorType,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
      });
    },
  };
}

/** Convenience: assert an experience belongs to a user (defence in depth). */
export async function experienceBelongsTo(
  db: DbClient,
  experienceId: string,
  userId: string,
): Promise<boolean> {
  const row = (
    await db
      .select({ id: experiences.id })
      .from(experiences)
      .where(and(eq(experiences.id, experienceId), eq(experiences.userId, userId)))
      .limit(1)
  )[0];
  return Boolean(row);
}
