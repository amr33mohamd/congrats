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
import { requireUser, requireAdmin, type SessionUser, AuthError } from '@/lib/auth';

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
