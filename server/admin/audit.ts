/**
 * Audit logging for admin actions. Every admin mutation appends an `audit_log`
 * row so governance/history is complete. Order transitions write their own audit
 * rows via the state machine's effects adapter; this helper covers the rest
 * (templates, categories, users, pricing, share-links).
 */
import { eq } from 'drizzle-orm';
import type { DbClient } from '@/db';
import { adminUsers, auditLog } from '@/db/schema';

export interface AuditActor {
  /** users.id from the session. */
  userId: string;
  /** admin_users.id (resolved), used as the audit actor_id. */
  adminUserId?: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditEntry {
  action: string; // e.g. 'template.create'
  entityType: string; // e.g. 'template'
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Resolve the admin_users.id for a session user id. The state machine records the
 * admin actor by admin_users.id (orders.reviewed_by FK), so admin order routes
 * must resolve it first. Returns undefined if the user has no admin row (should
 * not happen behind requireAdmin, but we stay defensive).
 */
export async function resolveAdminUserId(
  db: DbClient,
  userId: string,
): Promise<string | undefined> {
  const rows = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.userId, userId))
    .limit(1);
  return rows[0]?.id;
}

/** Append an admin audit row. */
export async function appendAdminAudit(
  db: DbClient,
  actor: AuditActor,
  entry: AuditEntry,
): Promise<void> {
  await db.insert(auditLog).values({
    actorId: actor.adminUserId ?? actor.userId,
    actorType: 'admin',
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
    ip: actor.ip ?? null,
    userAgent: actor.userAgent ?? null,
  });
}

/** Extract client IP + UA from request headers for audit context. */
export function requestMeta(req: Request): { ip?: string; userAgent?: string } {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined;
  const userAgent = req.headers.get('user-agent') ?? undefined;
  return { ip: ip ?? undefined, userAgent };
}
