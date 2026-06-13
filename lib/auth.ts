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

async function upsertUserByEmail(email: string) {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();

  const existing = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  let user = existing[0];
  if (!user) {
    const inserted = await db
      .insert(users)
      .values({ email: normalized, displayName: normalized.split('@')[0] })
      .returning();
    user = inserted[0];
  }

  // Promote to admin if the email matches the seeded admin and no admin row yet.
  const seedAdmin = (process.env.SEED_ADMIN_EMAIL ?? 'admin@congrats.dev').toLowerCase();
  const adminRow = await db.select().from(adminUsers).where(eq(adminUsers.userId, user.id)).limit(1);
  let role: string | null = adminRow[0]?.role ?? null;
  if (!adminRow[0] && normalized === seedAdmin) {
    const created = await db
      .insert(adminUsers)
      .values({ userId: user.id, role: 'superadmin' })
      .returning();
    role = created[0].role;
  }

  return { user, role };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      id: 'dev-login',
      name: 'Dev Login',
      credentials: { email: { label: 'Email', type: 'email' } },
      async authorize(creds) {
        const email = creds?.email;
        if (!email || typeof email !== 'string') return null;
        const { user, role } = await upsertUserByEmail(email);
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
