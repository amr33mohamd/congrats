/**
 * Ownership-scoped data-access base. Since there is NO Postgres RLS (Auth.js,
 * not Supabase), authorization lives HERE: every user-facing query MUST be
 * scoped by userId. Admin-wide queries go through `adminContext` which requires
 * an admin session.
 *
 * B1 (server/dashboard/**) extends `userContext`.
 * B2 (server/admin/**) extends `adminContext`.
 *
 * This module only provides the scoping primitives + a guarded query helper;
 * the actual repository methods are added by the backend teams in their folders.
 */
import { and, eq, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { getDb, type DbClient } from '@/db';
import { users } from '@/db/schema';
import { requireUser, requireAdmin, type SessionUser, AuthError } from '@/lib/auth';

/**
 * A JWT session can outlive its `users` row — e.g. after a DB reset or an
 * account deletion. Without this check, the stale id flows into inserts and
 * surfaces as a confusing 500 (FK violation) instead of an auth error. Verify
 * the row exists and treat a miss as an invalid session.
 *
 * Also re-checks `isBlocked` on EVERY request: since sessions are stateless
 * JWTs, blocking a user (server/admin/users-service) would otherwise have no
 * effect until their token expired. Blocked users are rejected immediately.
 */
async function assertUserExists(db: DbClient, userId: string): Promise<void> {
  const row = await db
    .select({ id: users.id, isBlocked: users.isBlocked })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row[0] || row[0].isBlocked) {
    throw new AuthError('authentication required', 'UNAUTHENTICATED');
  }
}

export interface UserContext {
  db: DbClient;
  user: SessionUser;
  /**
   * Compose a WHERE clause that is ALWAYS ANDed with `userColumn = user.id`.
   * Use for every owned-resource read/update/delete to prevent cross-user access.
   */
  ownedBy(userColumn: PgColumn, extra?: SQL): SQL;
}

export interface AdminContext {
  db: DbClient;
  admin: SessionUser;
}

/** Build a request-scoped context for the signed-in user (throws if anonymous). */
export async function userContext(): Promise<UserContext> {
  const user = await requireUser();
  const db = await getDb();
  await assertUserExists(db, user.id);
  return {
    db,
    user,
    ownedBy(userColumn: PgColumn, extra?: SQL): SQL {
      const base = eq(userColumn, user.id);
      return (extra ? and(base, extra) : base) as SQL;
    },
  };
}

/** Build a request-scoped context for an admin (throws if not admin). */
export async function adminContext(): Promise<AdminContext> {
  const admin = await requireAdmin();
  const db = await getDb();
  await assertUserExists(db, admin.id);
  return { db, admin };
}

/**
 * Assert a fetched row belongs to the user. Use after single-row lookups by id
 * where you cannot express ownership purely in the WHERE clause.
 */
export function assertOwned<T extends { userId: string }>(
  row: T | undefined,
  user: SessionUser,
): T {
  if (!row || row.userId !== user.id) {
    throw new AuthError('resource not found or not owned', 'FORBIDDEN');
  }
  return row;
}

export { AuthError };
