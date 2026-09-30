import { describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({ default: () => ({ handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }) }));
vi.mock('next-auth/providers/credentials', () => ({ default: (x: unknown) => x }));

describe('resolveAuthSecret', () => {
  it('prefers AUTH_SECRET', async () => {
    const { resolveAuthSecret } = await import('./auth');
    expect(resolveAuthSecret({ AUTH_SECRET: 'set', DATABASE_URL: 'postgres://a' })).toBe('set');
  });
  it('derives a stable, private secret from the database URL', async () => {
    const { resolveAuthSecret } = await import('./auth');
    const a = resolveAuthSecret({ DATABASE_URL: 'postgres://u:secret@h/db' });
    expect(a).toBe(resolveAuthSecret({ DATABASE_URL: 'postgres://u:secret@h/db' }));
    expect(a).not.toContain('secret@h');
    expect(a!.length).toBeGreaterThanOrEqual(40);
    expect(resolveAuthSecret({ DATABASE_URL: 'postgres://u:other@h/db' })).not.toBe(a);
  });
  it('has nothing to derive from without a database', async () => {
    const { resolveAuthSecret } = await import('./auth');
    expect(resolveAuthSecret({})).toBeUndefined();
  });
});
