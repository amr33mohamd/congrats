import { createHmac } from 'node:crypto';
/**
 * Auth.js (NextAuth v5) config with a DEV Credentials provider so login works
 * offline with no external email/OAuth. Entering an email upserts a `users` row;
 * if the email matches SEED_ADMIN_EMAIL (or already has an admin_users row) the
 * session is flagged as admin.
 *
 * Helpers: getSession(), requireUser(), requireAdmin().
 */
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, adminUsers } from '@/db/schema';
import { verifyPassword, DUMMY_PASSWORD_HASH } from '@/lib/password';
import { rateLimit, clientIp } from '@/lib/rate-limit';

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

/**
 * Resolve a user's admin role, auto-promoting the seeded admin email to
 * `superadmin` the first time it signs in. Returns null for normal users.
 */
export async function resolveRole(
  db: Awaited<ReturnType<typeof getDb>>,
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

const isProduction = () => process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: resolveAuthSecret(),
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [
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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id: string; role: string | null; locale?: string };
        token.uid = u.id;
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
