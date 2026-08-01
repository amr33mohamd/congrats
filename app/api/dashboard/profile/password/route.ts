/**
 * POST /api/dashboard/profile/password { currentPassword, newPassword }
 * → change the signed-in user's password after verifying the current one.
 */
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { userContext } from '@/server/db-context';
import { users } from '@/db/schema';
import { hashPassword, verifyPassword, passwordPolicyError } from '@/lib/password';
import { withErrors, readJson, json } from '@/server/dashboard/http';
import { DashboardError } from '@/server/dashboard/errors';

export const runtime = 'nodejs';

const ChangeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  return withErrors(async () => {
    const ctx = await userContext();
    const { currentPassword, newPassword } = await readJson(req, ChangeSchema);

    const policyError = passwordPolicyError(newPassword);
    if (policyError) throw DashboardError.validation(policyError);

    const row = (await ctx.db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, ctx.user.id)).limit(1))[0];
    // Users created before password auth (or via future SSO) may have no hash.
    const ok = row?.passwordHash ? await verifyPassword(currentPassword, row.passwordHash) : false;
    if (!ok) throw DashboardError.validation('Current password is incorrect.');

    const passwordHash = await hashPassword(newPassword);
    await ctx.db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, ctx.user.id));
    return json({ ok: true });
  });
}
