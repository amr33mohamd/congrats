/**
 * Google / Facebook sign-in without a database adapter (JWT sessions): the
 * provider profile is matched to a `users` row by email, creating it on first
 * sign-in. No extra table is needed:
 *
 *  - A verified provider email links to the account with that email (so a
 *    person who signed up with email+password and later taps "Google" lands in
 *    the same account). Linking clears that account's password, which was
 *    never verified — see upsertOAuthUser.
 *  - Facebook may return no email (phone-only accounts, or the person declined
 *    the permission). Those users get a stable synthetic address,
 *    `fb-<id>@users.congrats.local`, derived from the provider account id, so
 *    the same Facebook account always maps to the same row. The `.local`
 *    domain is reserved: nothing is ever emailed there, and the register
 *    route refuses it so nobody can squat a synthetic address.
 */
import { eq } from 'drizzle-orm';
import type { DbClient } from '@/db';
import { users } from '@/db/schema';
import { resolveRole } from './roles';
import { syntheticEmail, isSyntheticEmail, type OAuthProviderId } from './synthetic-email';

export { syntheticEmail, isSyntheticEmail, SYNTHETIC_EMAIL_DOMAIN, type OAuthProviderId } from './synthetic-email';

export interface OAuthProfileInput {
  provider: OAuthProviderId;
  providerAccountId: string;
  email?: string | null;
  /** Whether the provider vouches for the email. Unverified emails are never linked. */
  emailVerified: boolean;
  name?: string | null;
  image?: string | null;
}

export type OAuthUpsertResult =
  | { status: 'blocked' }
  | {
      status: 'ok';
      created: boolean;
      user: { id: string; email: string; displayName: string | null; locale: string };
      role: string | null;
    };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The email this profile signs in as: the verified provider email, else the synthetic one. */
export function oauthEmailFor(
  p: Pick<OAuthProfileInput, 'provider' | 'providerAccountId' | 'email' | 'emailVerified'>,
): string {
  const email = (p.email ?? '').trim().toLowerCase();
  if (email && p.emailVerified && email.length <= 254 && EMAIL_RE.test(email) && !isSyntheticEmail(email)) {
    return email;
  }
  return syntheticEmail(p.provider, p.providerAccountId);
}

const clip = (s: string | null | undefined, max: number) => {
  const v = (s ?? '').trim();
  return v ? v.slice(0, max) : null;
};
const httpsOnly = (u: string | null | undefined) =>
  u && /^https:\/\//i.test(u) && u.length <= 2000 ? u : null;

/**
 * Find-or-create the `users` row for an OAuth profile. Honours isBlocked and
 * resolves the admin role. New rows: locale 'ar', no password.
 */
export async function upsertOAuthUser(db: DbClient, p: OAuthProfileInput): Promise<OAuthUpsertResult> {
  const primary = oauthEmailFor(p);
  // A Facebook account that once signed in without an email keeps its row
  // even if it shares an email later.
  const synthetic = syntheticEmail(p.provider, p.providerAccountId);
  const candidates = primary === synthetic ? [synthetic] : [synthetic, primary];

  let row: typeof users.$inferSelect | undefined;
  for (const email of candidates) {
    row = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    if (row) break;
  }

  let created = false;
  const displayName = clip(p.name, 80);
  const avatarUrl = httpsOnly(p.image);

  if (!row) {
    const inserted = await db
      .insert(users)
      .values({ email: primary, passwordHash: null, displayName, avatarUrl, locale: 'ar' })
      .onConflictDoNothing({ target: users.email })
      .returning();
    if (inserted[0]) {
      row = inserted[0];
      created = true;
    } else {
      // Lost a race with a parallel first sign-in: read the winner's row.
      row = (await db.select().from(users).where(eq(users.email, primary)).limit(1))[0];
      if (!row) throw new Error('oauth upsert failed');
    }
  } else {
    // Sign-up never verifies email ownership, so a password on an account
    // matched by a provider-verified email may have been set by someone who
    // registered that address first. The provider just proved who owns it:
    // drop the unverified password so the squatter is locked out. The owner
    // can set a new one through "forgot password", which only reaches them.
    const dropPassword = row.email === primary && primary !== synthetic && Boolean(row.passwordHash);
    const patch = {
      ...(!row.displayName && displayName ? { displayName } : {}),
      ...(!row.avatarUrl && avatarUrl ? { avatarUrl } : {}),
      ...(dropPassword ? { passwordHash: null } : {}),
    };
    if (Object.keys(patch).length) {
      const updated = await db.update(users).set(patch).where(eq(users.id, row.id)).returning();
      row = updated[0] ?? row;
    }
  }

  if (row.isBlocked) return { status: 'blocked' };
  const role = await resolveRole(db, row);
  return {
    status: 'ok',
    created,
    user: { id: row.id, email: row.email, displayName: row.displayName, locale: row.locale },
    role,
  };
}
