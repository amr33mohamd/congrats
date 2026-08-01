/**
 * DB-backed OrderEffects adapter for admin-driven transitions (approve/reject/
 * refund). The state machine (lib/orders/state-machine.ts) is pure; it calls
 * back into these methods to persist the order, flip unlock/share-link state, and
 * append the audit row. ALL unlock side effects flow through here — admin routes
 * NEVER toggle experience.isUnlocked or share_link.isActive directly.
 */
import { and, eq } from 'drizzle-orm';
import type { DbClient } from '@/db';
import { experiences, shareLinks, orders, auditLog } from '@/db/schema';
import type { OrderEffects } from '@/lib/orders/state-machine';

export function makeAdminOrderEffects(db: DbClient): OrderEffects {
  return {
    async persistOrder(orderId, patch) {
      const update: Record<string, unknown> = {
        status: patch.status,
        updatedAt: new Date(),
      };
      // Only set columns the action actually produced (undefined → leave as-is).
      if (patch.paymentRef !== undefined) update.paymentRef = patch.paymentRef;
      if (patch.screenshotMediaId !== undefined) update.screenshotMediaId = patch.screenshotMediaId;
      if (patch.rejectReason !== undefined) update.rejectReason = patch.rejectReason;
      if (patch.reviewedBy !== undefined) update.reviewedBy = patch.reviewedBy;
      if (patch.reviewedAt !== undefined) update.reviewedAt = patch.reviewedAt;
      // Conditional on the expected current status → optimistic concurrency.
      const updated = await db
        .update(orders)
        .set(update)
        .where(and(eq(orders.id, orderId), eq(orders.status, patch.expectedFrom)))
        .returning({ id: orders.id });
      return updated.length > 0;
    },

    async setExperienceUnlocked(experienceId, unlocked) {
      await db
        .update(experiences)
        .set({
          isUnlocked: unlocked,
          // Keep the experience status coherent with its unlock state.
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
