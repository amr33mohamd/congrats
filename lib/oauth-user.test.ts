import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

// Throwaway in-memory PGlite (must be set before @/db is imported).
process.env.PGLITE_PATH = 'memory://';
delete process.env.DATABASE_URL;

import { getDb, type DbClient } from '@/db';
import { users, adminUsers } from '@/db/schema';
import {
  isSyntheticEmail,
  oauthEmailFor,
  syntheticEmail,
  upsertOAuthUser,
  SYNTHETIC_EMAIL_DOMAIN,
} from './oauth-user';

let db: DbClient;
beforeAll(async () => {
  db = await getDb();
});

const uniq = () => Math.random().toString(36).slice(2, 10);

describe('synthetic emails', () => {
  it('is stable per provider account and recognisable', () => {
    expect(syntheticEmail('facebook', '10223344556677')).toBe(`fb-10223344556677@${SYNTHETIC_EMAIL_DOMAIN}`);
    expect(syntheticEmail('facebook', '10223344556677')).toBe(syntheticEmail('facebook', '10223344556677'));
    expect(syntheticEmail('google', 'ABC')).toBe(`google-abc@${SYNTHETIC_EMAIL_DOMAIN}`);
    expect(isSyntheticEmail('fb-1@users.congrats.local')).toBe(true);
    expect(isSyntheticEmail(' FB-1@USERS.CONGRATS.LOCAL ')).toBe(true);
    expect(isSyntheticEmail('someone@gmail.com')).toBe(false);
    expect(isSyntheticEmail(null)).toBe(false);
  });

  it('strips anything that could break out of the local part', () => {
    expect(syntheticEmail('facebook', '12@evil.com')).toBe(`fb-12evilcom@${SYNTHETIC_EMAIL_DOMAIN}`);
    expect(() => syntheticEmail('facebook', '@@')).toThrow();
  });

  it('uses the provider email only when verified and real', () => {
    const base = { provider: 'google' as const, providerAccountId: '42' };
    expect(oauthEmailFor({ ...base, email: 'Sara@Gmail.com', emailVerified: true })).toBe('sara@gmail.com');
    expect(oauthEmailFor({ ...base, email: 'sara@gmail.com', emailVerified: false })).toBe(syntheticEmail('google', '42'));
    expect(oauthEmailFor({ ...base, email: null, emailVerified: true })).toBe(syntheticEmail('google', '42'));
    expect(oauthEmailFor({ ...base, email: 'not-an-email', emailVerified: true })).toBe(syntheticEmail('google', '42'));
    // A provider can't hand us someone else's placeholder.
    expect(oauthEmailFor({ ...base, email: 'fb-9@users.congrats.local', emailVerified: true })).toBe(
      syntheticEmail('google', '42'),
    );
  });
});

describe('upsertOAuthUser', () => {
  it('creates a new user with locale ar, profile name/avatar and no password', async () => {
    const email = `g-${uniq()}@gmail.com`;
    const r = await upsertOAuthUser(db, {
      provider: 'google',
      providerAccountId: uniq(),
      email,
      emailVerified: true,
      name: 'Sara Ahmed',
      image: 'https://lh3.googleusercontent.com/a/photo',
    });
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    expect(r.created).toBe(true);
    expect(r.role).toBeNull();
    const row = (await db.select().from(users).where(eq(users.id, r.user.id)))[0];
    expect(row.email).toBe(email);
    expect(row.locale).toBe('ar');
    expect(row.passwordHash).toBeNull();
    expect(row.displayName).toBe('Sara Ahmed');
    expect(row.avatarUrl).toBe('https://lh3.googleusercontent.com/a/photo');
  });

  it('links to an existing email+password account and keeps its data', async () => {
    const email = `existing-${uniq()}@example.com`;
    const [existing] = await db
      .insert(users)
      .values({ email, passwordHash: 'hash', displayName: 'Mona', locale: 'en' })
      .returning();
    const r = await upsertOAuthUser(db, {
      provider: 'google',
      providerAccountId: uniq(),
      email: email.toUpperCase(),
      emailVerified: true,
      name: 'Other Name',
      image: 'https://example.com/a.png',
    });
    expect(r.status === 'ok' && r.user.id).toBe(existing.id);
    expect(r.status === 'ok' && r.created).toBe(false);
    const row = (await db.select().from(users).where(eq(users.id, existing.id)))[0];
    expect(row.displayName).toBe('Mona'); // not overwritten
    expect(row.passwordHash).toBe('hash');
    expect(row.locale).toBe('en');
    expect(row.avatarUrl).toBe('https://example.com/a.png'); // blank filled
  });

  it('gives a Facebook account without email a stable synthetic row', async () => {
    const fbId = String(Date.now()) + uniq().replace(/\D/g, '');
    const first = await upsertOAuthUser(db, { provider: 'facebook', providerAccountId: fbId, email: null, emailVerified: false, name: 'Omar' });
    const again = await upsertOAuthUser(db, { provider: 'facebook', providerAccountId: fbId, email: null, emailVerified: false, name: 'Omar' });
    expect(first.status === 'ok' && first.created).toBe(true);
    expect(again.status === 'ok' && again.created).toBe(false);
    expect(first.status === 'ok' && again.status === 'ok' && first.user.id === again.user.id).toBe(true);
    expect(first.status === 'ok' && first.user.email).toBe(syntheticEmail('facebook', fbId));

    // Later the same Facebook account shares an email: still the same row.
    const withEmail = await upsertOAuthUser(db, {
      provider: 'facebook',
      providerAccountId: fbId,
      email: `omar-${uniq()}@example.com`,
      emailVerified: true,
    });
    expect(withEmail.status === 'ok' && first.status === 'ok' && withEmail.user.id === first.user.id).toBe(true);
  });

  it('ignores non-https avatars', async () => {
    const r = await upsertOAuthUser(db, {
      provider: 'facebook',
      providerAccountId: uniq(),
      email: null,
      emailVerified: false,
      image: 'javascript:alert(1)',
    });
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    const row = (await db.select().from(users).where(eq(users.id, r.user.id)))[0];
    expect(row.avatarUrl).toBeNull();
  });

  it('refuses blocked accounts', async () => {
    const email = `blocked-${uniq()}@example.com`;
    await db.insert(users).values({ email, isBlocked: true });
    const r = await upsertOAuthUser(db, { provider: 'google', providerAccountId: uniq(), email, emailVerified: true });
    expect(r).toEqual({ status: 'blocked' });
  });

  it('resolves the admin role', async () => {
    const email = `admin-${uniq()}@example.com`;
    const [u] = await db.insert(users).values({ email }).returning();
    await db.insert(adminUsers).values({ userId: u.id, role: 'reviewer' });
    const r = await upsertOAuthUser(db, { provider: 'google', providerAccountId: uniq(), email, emailVerified: true });
    expect(r.status === 'ok' && r.role).toBe('reviewer');
  });
});
