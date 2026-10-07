/**
 * Admin role resolution, kept free of next-auth imports so the OAuth upsert
 * (lib/oauth-user.ts) and its tests can use it. Re-exported from lib/auth.ts.
 */
import { eq } from 'drizzle-orm';
import type { DbClient } from '@/db';
import { adminUsers } from '@/db/schema';

const isProduction = () => process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

/**
 * Resolve a user's admin role, auto-promoting the seeded admin email to
 * `superadmin` the first time it signs in. Returns null for normal users.
 */
export async function resolveRole(
  db: DbClient,
  user: { id: string; email: string },
): Promise<string | null> {
  const adminRow = await db.select().from(adminUsers).where(eq(adminUsers.userId, user.id)).limit(1);
  if (adminRow[0]) return adminRow[0].role;
  // The fallback address is in this public repo: in production anyone could
  // register it and walk in as superadmin. Only an explicitly configured
  // SEED_ADMIN_EMAIL is promoted there.
  const configured = process.env.SEED_ADMIN_EMAIL;
  const seedAdmin = (configured ?? (isProduction() ? '' : 'admin@congrats.dev')).toLowerCase();
  if (seedAdmin && user.email.toLowerCase() === seedAdmin) {
    const created = await db
      .insert(adminUsers)
      .values({ userId: user.id, role: 'superadmin' })
      .returning();
    return created[0].role;
  }
  return null;
}
