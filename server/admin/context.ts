/**
 * Per-request admin route context. Wraps adminContext() (which enforces
 * requireAdmin) and pre-resolves the AuditActor (admin_users.id + request IP/UA)
 * so route handlers can audit consistently.
 */
import { adminContext, type AdminContext } from '@/server/db-context';
import { resolveAdminUserId, requestMeta, type AuditActor } from './audit';

export interface AdminRouteContext {
  ctx: AdminContext;
  actor: AuditActor;
}

/**
 * Build the admin context for a request. Throws AuthError (mapped to 401/403 by
 * errorResponse) if the caller is not an admin.
 */
export async function adminRoute(req: Request): Promise<AdminRouteContext> {
  const ctx = await adminContext();
  const adminUserId = await resolveAdminUserId(ctx.db, ctx.admin.id);
  const meta = requestMeta(req);
  return {
    ctx,
    actor: { userId: ctx.admin.id, adminUserId, ip: meta.ip, userAgent: meta.userAgent },
  };
}
