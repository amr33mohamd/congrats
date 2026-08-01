/**
 * Audit log reader (admin): list audit rows with filters (actor type, entity,
 * action) newest-first.
 */
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { auditLog } from '@/db/schema';
import type { AuditLogRow } from '@/db/schema';
import type { AdminContext } from '@/server/db-context';

export async function listAudit(
  ctx: AdminContext,
  params: {
    actorType?: 'user' | 'admin' | 'system';
    entityType?: string;
    entityId?: string;
    action?: string;
    limit: number;
    offset: number;
  },
): Promise<{ entries: AuditLogRow[] }> {
  const where: SQL[] = [];
  if (params.actorType) where.push(eq(auditLog.actorType, params.actorType));
  if (params.entityType) where.push(eq(auditLog.entityType, params.entityType));
  if (params.entityId) where.push(eq(auditLog.entityId, params.entityId));
  if (params.action) where.push(eq(auditLog.action, params.action));

  const entries = await ctx.db
    .select()
    .from(auditLog)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(params.limit)
    .offset(params.offset);

  return { entries };
}
