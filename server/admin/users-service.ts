/**
 * User administration (admin): list users with search/filter and block/unblock.
 * Blocking sets users.is_blocked; consumers (auth/dashboard) enforce the gate.
 */
import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { users, adminUsers } from '@/db/schema';
import type { User } from '@/db/schema';
import type { AdminContext } from '@/server/db-context';
import { appendAdminAudit, type AuditActor } from './audit';
import { notFound } from './http';

// Omit passwordHash — secrets must never reach the admin API surface.
export interface AdminUserRow extends Omit<User, 'passwordHash'> {
  isAdmin: boolean;
  role: string | null;
}

export async function listUsers(
  ctx: AdminContext,
  params: { q?: string; blocked?: boolean; limit: number; offset: number },
): Promise<{ users: AdminUserRow[] }> {
  const where: SQL[] = [];
  if (params.q) {
    const like = `%${params.q}%`;
    where.push(or(ilike(users.email, like), ilike(users.displayName, like)) as SQL);
  }
  if (params.blocked !== undefined) where.push(eq(users.isBlocked, params.blocked));

  const rows = await ctx.db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      locale: users.locale,
      avatarUrl: users.avatarUrl,
      isBlocked: users.isBlocked,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      role: adminUsers.role,
    })
    .from(users)
    .leftJoin(adminUsers, eq(adminUsers.userId, users.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(params.limit)
    .offset(params.offset);

  return {
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      displayName: r.displayName,
      locale: r.locale,
      avatarUrl: r.avatarUrl,
      isBlocked: r.isBlocked,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      isAdmin: Boolean(r.role),
      role: r.role ?? null,
    })),
  };
}

export async function setUserBlocked(
  ctx: AdminContext,
  userId: string,
  isBlocked: boolean,
  actor: AuditActor,
): Promise<Omit<User, 'passwordHash'>> {
  const existing = await ctx.db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!existing[0]) throw notFound('user not found');

  // Explicit column list so the password hash never enters an API response.
  const rows = await ctx.db
    .update(users)
    .set({ isBlocked, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      locale: users.locale,
      avatarUrl: users.avatarUrl,
      isBlocked: users.isBlocked,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  await appendAdminAudit(ctx.db, actor, {
    action: isBlocked ? 'user.block' : 'user.unblock',
    entityType: 'user',
    entityId: userId,
    metadata: { isBlocked },
  });
  return rows[0];
}
