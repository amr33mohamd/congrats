/**
 * POST /api/auth/register → create a new email+password account.
 *
 * Public, rate-limited. Validates the body, enforces the password policy, hashes
 * the password and inserts a `users` row. Does NOT create a session — the client
 * calls `signIn('password', …)` afterwards. Responds 409 if the email is taken.
 */
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { hashPassword, passwordPolicyError } from '@/lib/password';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { withErrors, readJson, created } from '@/server/dashboard/http';
import { DashboardError } from '@/server/dashboard/errors';

export const runtime = 'nodejs';

const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
  displayName: z.string().trim().min(1).max(80).optional(),
  locale: z.enum(['ar', 'en']).optional(),
});

export async function POST(req: Request) {
  return withErrors(async () => {
    const ip = clientIp(req);
    const limit = rateLimit(`register:${ip}`, 5, 60_000);
    if (!limit.ok) {
      throw DashboardError.validation(`Too many attempts. Try again in ${limit.retryAfterSec}s.`);
    }

    const body = await readJson(req, RegisterSchema);

    const policyError = passwordPolicyError(body.password);
    if (policyError) throw DashboardError.validation(policyError);

    const db = await getDb();
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
    if (existing[0]) {
      throw DashboardError.conflict('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(body.password);
    const [user] = await db
      .insert(users)
      .values({
        email: body.email,
        passwordHash,
        displayName: body.displayName ?? body.email.split('@')[0],
        locale: body.locale ?? 'ar',
      })
      .returning({ id: users.id, email: users.email });

    return created({ user: { id: user.id, email: user.email } });
  });
}
