/**
 * Admin user controls against in-process PGlite: comped-access toggle (audited
 * like block/unblock), the per-request admin re-check, and seed hygiene
 * (archiving templates dropped from the catalog).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

process.env.PGLITE_PATH = 'memory://';
delete process.env.DATABASE_URL;

// lib/auth pulls in next-auth (needs the Next runtime). Stub it: requireAdmin
// returns whatever session `sessionRef` holds, i.e. a JWT that claims admin.
const sessionRef = vi.hoisted(() => ({
  current: null as null | { id: string; email: string; isAdmin: boolean; role: string | null; locale: string },
}));
vi.mock('@/lib/auth', () => {
  class AuthError extends Error {
    constructor(message: string, readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN') {
      super(message);
      this.name = 'AuthError';
    }
  }
  return {
    AuthError,
    getSession: vi.fn(async () => sessionRef.current),
    requireUser: vi.fn(async () => {
      if (!sessionRef.current) throw new AuthError('authentication required', 'UNAUTHENTICATED');
      return sessionRef.current;
    }),
    requireAdmin: vi.fn(async () => {
      if (!sessionRef.current?.isAdmin) throw new AuthError('admin privileges required', 'FORBIDDEN');
      return sessionRef.current;
    }),
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
});

import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, adminUsers, auditLog, templates } from '@/db/schema';
import { parseTemplateDefinition } from '@/lib/template-contract';
import { hasAdminRow, adminContext, type AdminContext } from '@/server/db-context';
import { archiveUnlistedTemplates } from '@/db/seed';
import { setUserAllAccess, listUsers } from './users-service';
import type { AuditActor } from './audit';

let db: Awaited<ReturnType<typeof getDb>>;
let ctx: AdminContext;
let actor: AuditActor;
let targetId = '';

beforeAll(async () => {
  db = await getDb();
  const [admin] = await db.insert(users).values({ email: 'ua-admin@test.dev', locale: 'en' }).returning();
  const [adminRow] = await db.insert(adminUsers).values({ userId: admin.id, role: 'superadmin' }).returning();
  const [target] = await db.insert(users).values({ email: 'ua-target@test.dev', locale: 'ar' }).returning();
  targetId = target.id;
  ctx = { db, admin: { id: admin.id, email: admin.email, isAdmin: true, role: 'superadmin', locale: 'en' } };
  actor = { userId: admin.id, adminUserId: adminRow.id };
});

describe('setUserAllAccess', () => {
  it('grants and revokes, never returns the password hash, and audits both', async () => {
    const granted = await setUserAllAccess(ctx, targetId, true, actor);
    expect(granted.allAccess).toBe(true);
    expect(granted).not.toHaveProperty('passwordHash');

    const listed = (await listUsers(ctx, { limit: 50, offset: 0 })).users.find((u) => u.id === targetId);
    expect(listed?.allAccess).toBe(true);

    const revoked = await setUserAllAccess(ctx, targetId, false, actor);
    expect(revoked.allAccess).toBe(false);

    const audits = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, 'user'), eq(auditLog.entityId, targetId)));
    expect(audits.map((a) => a.action).sort()).toEqual(['user.all_access_grant', 'user.all_access_revoke']);
    const grant = audits.find((a) => a.action === 'user.all_access_grant')!;
    expect(grant.actorId).toBe(actor.adminUserId);
    expect(grant.metadata).toMatchObject({ allAccess: true, previous: false });
  });

  it('404s for an unknown user without writing an audit row', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';
    await expect(setUserAllAccess(ctx, missing, true, actor)).rejects.toThrow(/not found/);
    const audits = await db.select().from(auditLog).where(eq(auditLog.entityId, missing));
    expect(audits).toHaveLength(0);
  });
});

describe('hasAdminRow (per-request admin re-check)', () => {
  it('is true for an admin and false once the admin row is gone', async () => {
    const [u] = await db.insert(users).values({ email: 'ua-demoted@test.dev', locale: 'en' }).returning();
    await db.insert(adminUsers).values({ userId: u.id, role: 'reviewer' });
    expect(await hasAdminRow(db, u.id)).toBe(true);
    sessionRef.current = { id: u.id, email: u.email, isAdmin: true, role: 'reviewer', locale: 'en' };
    await expect(adminContext()).resolves.toMatchObject({ admin: { id: u.id } });

    await db.delete(adminUsers).where(eq(adminUsers.userId, u.id));
    // The JWT minted before this still says isAdmin — the DB check is what stops it.
    expect(await hasAdminRow(db, u.id)).toBe(false);
    await expect(adminContext()).rejects.toThrow(/admin privileges required/);
    expect(await hasAdminRow(db, targetId)).toBe(false);
    sessionRef.current = null;
  });
});

describe('archiveUnlistedTemplates (seed hygiene)', () => {
  const def = parseTemplateDefinition({
    version: 1,
    locale: 'en',
    direction: 'ltr',
    theme: { palette: ['#fff'] },
    scenes: [{ id: 'cover', type: 'Cover', slots: [] }],
  });
  const insert = (slug: string, status: 'published' | 'draft' | 'archived') =>
    db.insert(templates).values({ slug, locale: 'en', direction: 'ltr', definition: def, status });

  it('archives only published rows missing from the catalog, never deletes, and is idempotent', async () => {
    await insert('seed-keep', 'published');
    await insert('seed-gone', 'published');
    await insert('seed-draft', 'draft');
    await insert('seed-old', 'archived');

    // Everything else in this in-memory DB is also "not in the catalog" — scope
    // the assertion to our rows by listing every other published slug as kept.
    const others = (await db.select({ slug: templates.slug }).from(templates))
      .map((r) => r.slug)
      .filter((s) => !s.startsWith('seed-'));
    const archived = await archiveUnlistedTemplates(db, ['seed-keep', ...others]);
    expect(archived).toEqual(['seed-gone']);

    const status = async (slug: string) =>
      (await db.select({ status: templates.status }).from(templates).where(eq(templates.slug, slug)))[0]?.status;
    expect(await status('seed-keep')).toBe('published');
    expect(await status('seed-gone')).toBe('archived'); // still present
    expect(await status('seed-draft')).toBe('draft'); // drafts untouched
    expect(await status('seed-old')).toBe('archived');

    expect(await archiveUnlistedTemplates(db, ['seed-keep', ...others])).toEqual([]);
  });

  it('refuses to archive anything when given an empty catalog', async () => {
    await insert('seed-safety', 'published');
    expect(await archiveUnlistedTemplates(db, [])).toEqual([]);
    const row = (await db.select().from(templates).where(eq(templates.slug, 'seed-safety')))[0];
    expect(row.status).toBe('published');
  });
});
