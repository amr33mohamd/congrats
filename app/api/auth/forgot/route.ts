/**
 * POST /api/auth/forgot { email, locale? } → start a password reset.
 *
 * Always responds 200 (never reveals whether the email is registered). When the
 * email IS registered, a single-use reset token (1h TTL) is created and a reset
 * link is emailed (or logged in dev). Rate-limited per IP.
 */
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, passwordResetTokens } from '@/db/schema';
import { generateResetToken, RESET_TOKEN_TTL_MS } from '@/lib/reset-token';
import { sendEmail, appBaseUrl } from '@/lib/email';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { isSyntheticEmail } from '@/lib/oauth-user';
import { withErrors, readJson, json } from '@/server/dashboard/http';
import { DashboardError } from '@/server/dashboard/errors';

export const runtime = 'nodejs';

const ForgotSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  locale: z.enum(['ar', 'en']).optional(),
});

export async function POST(req: Request) {
  return withErrors(async () => {
    const ip = clientIp(req);
    const limit = rateLimit(`forgot:${ip}`, 5, 60_000);
    if (!limit.ok) throw DashboardError.validation(`Too many attempts. Try again in ${limit.retryAfterSec}s.`);

    const { email, locale } = await readJson(req, ForgotSchema);
    // Per-recipient cap as well, so rotating source IPs can't mail-bomb one
    // inbox. Silently succeed (same response) to avoid an existence oracle.
    if (!rateLimit(`forgot-email:${email}`, 3, 15 * 60_000).ok) return json({ ok: true });
    const db = await getDb();
    const found = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email)).limit(1);
    const user = found[0];

    // Placeholder addresses of Facebook-only accounts never receive mail.
    if (user && !isSyntheticEmail(user.email)) {
      const { raw, hash } = generateResetToken();
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      });
      const url = `${appBaseUrl()}/${locale ?? 'en'}/reset?token=${raw}`;
      await sendEmail({
        to: user.email,
        subject: 'Reset your Congrats password',
        text: `Reset your password using this link (valid for 1 hour): ${url}`,
        html: `<p>Tap the button to reset your Congrats password. This link is valid for 1 hour.</p>
               <p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#F0436E;color:#fff;border-radius:9999px;text-decoration:none;font-weight:600">Reset password</a></p>
               <p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>`,
      });
    }

    // Identical response whether or not the email exists.
    return json({ ok: true });
  });
}
