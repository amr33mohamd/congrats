import { createHmac } from 'node:crypto';
/**
 * Auth.js (NextAuth v5) config. Email+password (Credentials) always; Google and
 * Facebook one-tap sign-in when their AUTH_*_ID / AUTH_*_SECRET env vars are
 * set (see docs/oauth-setup.md). JWT sessions, no adapter: OAuth profiles are
 * matched to `users` rows by email in the signIn callback (lib/oauth-user.ts).
 * If the email matches SEED_ADMIN_EMAIL (or already has an admin_users row)
 * the session is flagged as admin.
 *
 * Helpers: getSession(), requireUser(), requireAdmin().
 */
import NextAuth, { type DefaultSession, type User } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { after } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword, DUMMY_PASSWORD_HASH } from '@/lib/password';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { resolveRole } from '@/lib/roles';
import { enabledOAuthProviders } from '@/lib/auth-providers';
import { upsertOAuthUser, type OAuthProviderId } from '@/lib/oauth-user';
import { notifyAdmin, cairoTime } from '@/lib/admin-notify';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      role: string | null;
      locale: string;
    } & DefaultSession['user'];
  }
}

// Re-exported so existing imports from '@/lib/auth' keep working.
export { resolveRole };

/**
 * AUTH_SECRET when set. Otherwise, on a deploy with a database, a secret
 * derived from the database connection string: it is private to the host,
 * stable across instances and restarts, and never in the repo — so a first
 * deploy works before the owner has generated a secret. Setting AUTH_SECRET
 * later takes over (signing everyone out once). Changing the database
 * password also rotates the derived secret.
 */
export function resolveAuthSecret(env: Record<string, string | undefined> = process.env): string | undefined {
  if (env.AUTH_SECRET) return env.AUTH_SECRET;
  const source = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL;
  if (!source) return undefined;
  return createHmac('sha256', source).update('congrats:auth-secret:v1').digest('base64');
}

const oauthEnabled = enabledOAuthProviders();

/** Fields our callbacks carry from sign-in into the JWT. */
type SignedInUser = User & { role?: string | null; locale?: string; congratsUserId?: string };

const isOAuthProvider = (id: string | undefined): id is OAuthProviderId => id === 'google' || id === 'facebook';

/**
 * Match an OAuth profile to a `users` row (creating it on first sign-in) and
 * rewrite the Auth.js user object to OUR id/email/role. Returns false for a
 * blocked account.
 */
async function linkOAuthUser(
  user: SignedInUser,
  provider: OAuthProviderId,
  providerAccountId: string,
  profile: Record<string, unknown> | undefined,
): Promise<boolean> {
  if (user.congratsUserId) return true;
  const db = await getDb();
  const result = await upsertOAuthUser(db, {
    provider,
    providerAccountId,
    email: user.email,
    // Google says whether it verified the address; Facebook only returns
    // confirmed emails.
    emailVerified: provider === 'google' ? profile?.email_verified === true : Boolean(user.email),
    name: user.name,
    image: user.image,
  });
  if (result.status === 'blocked') return false;

  user.id = result.user.id;
  user.congratsUserId = result.user.id;
  user.email = result.user.email;
  user.name = result.user.displayName ?? user.name;
  user.role = result.role;
  user.locale = result.user.locale;

  if (result.created) {
    // Same owner email as the register route, after the response is sent.
    const notice = () =>
      notifyAdmin({
        subject: 'New sign-up',
        rows: [
          ['Email', result.user.email], // placeholder addresses render as "Facebook account"
          ['Name', result.user.displayName ?? '—'],
          ['Via', provider === 'google' ? 'Google' : 'Facebook'],
          ['Language', result.user.locale],
          ['Time (Cairo)', cairoTime()],
        ],
        actionPath: '/ar/admin/users',
        actionLabel: 'Open users',
      });
    try {
      after(notice);
    } catch {
      // Outside a request scope (not expected in the auth route): fire and forget.
      void notice();
    }
  }
  return true;
}

const providers: Provider[] = [
  Credentials({
    id: 'password',
    name: 'Email & Password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(creds, request) {
      const email = typeof creds?.email === 'string' ? creds.email.trim().toLowerCase() : '';
      const password = typeof creds?.password === 'string' ? creds.password : '';
      if (!email || !password) return null;

      // Brute-force protection: cap attempts per IP and per email/window.
      const ip = request ? clientIp(request as unknown as Request) : 'local';
      if (!rateLimit(`login-ip:${ip}`, 20, 60_000).ok) return null;
      if (!rateLimit(`login-email:${email}`, 8, 60_000).ok) return null;

      const db = await getDb();
      const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = found[0];
      // Always run a bcrypt compare (against a dummy hash when the user is
      // missing) so timing can't reveal whether the email is registered.
      const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
      // Same outcome whether the user is missing, blocked, or the password is wrong.
      if (!user || user.isBlocked || !ok) return null;

      const role = await resolveRole(db, user);
      return {
        id: user.id,
        email: user.email,
        name: user.displayName ?? undefined,
        // carried into the jwt callback below
        role,
        locale: user.locale,
      } as unknown as { id: string };
    },
  }),
  // Registered only when configured. Auth.js reads AUTH_GOOGLE_ID/SECRET and
  // AUTH_FACEBOOK_ID/SECRET from the environment itself.
  ...(oauthEnabled.google ? [Google] : []),
  ...(oauthEnabled.facebook
    ? [
        Facebook({
          // The person may still untick email; lib/oauth-user.ts copes.
          authorization: {
            url: 'https://www.facebook.com/v19.0/dialog/oauth',
            params: { scope: 'email,public_profile' },
          },
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: resolveAuthSecret(),
  trustHost: true,
  session: { strategy: 'jwt' },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !isOAuthProvider(account.provider)) return true;
      return linkOAuthUser(
        user as SignedInUser,
        account.provider,
        account.providerAccountId,
        profile as Record<string, unknown> | undefined,
      );
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        const u = user as SignedInUser;
        // signIn has normally linked the account already; this covers any path
        // that reaches here without it, so a provider id never becomes our uid.
        if (account && isOAuthProvider(account.provider) && !u.congratsUserId) {
          const ok = await linkOAuthUser(
            u,
            account.provider,
            account.providerAccountId,
            profile as Record<string, unknown> | undefined,
          );
          if (!ok) return null;
        }
        token.uid = u.id;
        token.sub = u.id;
        token.email = u.email;
        token.role = u.role ?? null;
        token.locale = u.locale ?? 'ar';
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = (token.uid as string) ?? '';
      session.user.role = (token.role as string | null) ?? null;
      session.user.isAdmin = Boolean(token.role);
      session.user.locale = (token.locale as string) ?? 'ar';
      return session;
    },
  },
  pages: {
    signIn: '/login',
    // OAuth failures (cancelled, blocked account) come back to the login page
    // with ?error=… instead of Auth.js's English error page.
    error: '/login',
  },
});

/* ───────────────────────────── Helpers ────────────────────────────── */

export class AuthError extends Error {
  constructor(message: string, readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN') {
    super(message);
    this.name = 'AuthError';
  }
}

export interface SessionUser {
  id: string;
  email: string;
  isAdmin: boolean;
  role: string | null;
  locale: string;
}

/** Returns the current session user, or null if unauthenticated. */
export async function getSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    isAdmin: session.user.isAdmin,
    role: session.user.role,
    locale: session.user.locale,
  };
}

/** Throws AuthError('UNAUTHENTICATED') if no session. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new AuthError('authentication required', 'UNAUTHENTICATED');
  return user;
}

/** Throws if not authenticated, or AuthError('FORBIDDEN') if not an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) throw new AuthError('admin privileges required', 'FORBIDDEN');
  return user;
}
