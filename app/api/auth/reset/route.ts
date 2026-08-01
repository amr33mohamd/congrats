/**
 * POST /api/auth/reset { token, password } → complete a password reset.
 *
 * Validates the single-use token (unexpired, unused), enforces the password
 * policy, updates the user's hash, and burns the token (+ any other outstanding
 * tokens for that user). Rate-limited per IP.
 */
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, passwordResetTokens } from '@/db/schema';
import { hashPassword, passwordPolicyError } from '@/lib/password';
import { hashResetToken } from '@/lib/reset-token';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { withErrors, readJson, json } from '@/server/dashboard/http';
import { DashboardError } from '@/server/dashboard/errors';

export const runtime = 'nodejs';

const ResetSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  return withErrors(async () => {
    const ip = clientIp(req);
    const limit = rateLimit(`reset:${ip}`, 10, 60_000);
    if (!limit.ok) throw DashboardError.validation(`Too many attempts. Try again in ${limit.retryAfterSec}s.`);

    const { token, password } = await readJson(req, ResetSchema);

    const policyError = passwordPolicyError(password);
    if (policyError) throw DashboardError.validation(policyError);

    const db = await getDb();
    const tokenHash = hashResetToken(token);
    const rows = await db
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt)))
      .limit(1);
    const row = rows[0];
    if (!row || row.expiresAt.getTime() < Date.now()) {
      throw DashboardError.validation('This reset link is invalid or has expired.');
    }

    const passwordHash = await hashPassword(password);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, row.userId));
    // Burn this token and any other outstanding tokens for the user.
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.userId, row.userId), isNull(passwordResetTokens.usedAt)));

    return json({ ok: true });
  });
}
