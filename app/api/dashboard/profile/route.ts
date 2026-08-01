/**
 * GET   /api/dashboard/profile  → the signed-in user's account.
 * PATCH /api/dashboard/profile  → update display name / locale / avatar.
 * Authenticated; never returns the password hash.
 */
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { userContext } from '@/server/db-context';
import { users } from '@/db/schema';
import { withErrors, readJson, json } from '@/server/dashboard/http';

export const runtime = 'nodejs';

const PROFILE_COLUMNS = {
  id: users.id,
  email: users.email,
  displayName: users.displayName,
  locale: users.locale,
  avatarUrl: users.avatarUrl,
} as const;

export async function GET() {
  return withErrors(async () => {
    const ctx = await userContext();
    const row = (await ctx.db.select(PROFILE_COLUMNS).from(users).where(eq(users.id, ctx.user.id)).limit(1))[0];
    return json({ user: { ...row, isAdmin: ctx.user.isAdmin } });
  });
}

const UpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  locale: z.enum(['ar', 'en']).optional(),
  avatarUrl: z
    .string()
    .url()
    .max(2048)
    .refine((u) => /^https?:\/\//i.test(u), 'Avatar URL must be an http(s) link')
    .nullable()
    .optional(),
});

export async function PATCH(req: Request) {
  return withErrors(async () => {
    const ctx = await userContext();
    const patch = await readJson(req, UpdateSchema);
    const [row] = await ctx.db
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id))
      .returning(PROFILE_COLUMNS);
    return json({ user: { ...row, isAdmin: ctx.user.isAdmin } });
  });
}
