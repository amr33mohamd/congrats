/**
 * Share-link moderation (admin): disable abusive links by toggling visibility or
 * isActive. This is a moderation override and is independent of the order state
 * machine (which manages isActive as a payment side-effect). Setting visibility
 * to 'disabled' also forces isActive=false so the unlock gate fails closed.
 */
import { eq } from 'drizzle-orm';
import { shareLinks } from '@/db/schema';
import type { ShareLink } from '@/db/schema';
import type { AdminContext } from '@/server/db-context';
import { appendAdminAudit, type AuditActor } from './audit';
import { notFound } from './http';
import type { UpdateShareLinkInput } from './schemas';

export async function updateShareLink(
  ctx: AdminContext,
  id: string,
  input: UpdateShareLinkInput,
  actor: AuditActor,
): Promise<ShareLink> {
  const existing = await ctx.db.select().from(shareLinks).where(eq(shareLinks.id, id)).limit(1);
  if (!existing[0]) throw notFound('share link not found');

  const patch: Record<string, unknown> = {};
  if (input.visibility !== undefined) {
    patch.visibility = input.visibility;
    // Disabling visibility must also deactivate so the gate fails closed.
    if (input.visibility === 'disabled') patch.isActive = false;
  }
  if (input.isActive !== undefined) patch.isActive = input.isActive;

  const rows = await ctx.db.update(shareLinks).set(patch).where(eq(shareLinks.id, id)).returning();
  await appendAdminAudit(ctx.db, actor, {
    action: 'share_link.moderate',
    entityType: 'share_link',
    entityId: id,
    metadata: { ...input },
  });
  return rows[0];
}
