import { describe, expect, it, vi } from 'vitest';
import { assertEnv, checkEnv } from './env';

const GOOD_PROD = {
  NODE_ENV: 'production',
  AUTH_SECRET: 'q8Yt3v0mN7pX2rL5sK9wB1cD4fG6hJ0kZ3aE8uI2oP4=',
  AUTH_URL: 'https://congrats.example.com',
  DATABASE_URL: 'postgresql://u:p@db.example.com:5432/congrats',
  INSTAPAY_HANDLE: 'shop@instapay',
  RESEND_API_KEY: 're_x',
  EMAIL_FROM: 'Congrats <no-reply@example.com>',
  SENTRY_DSN: 'https://abc@o1.ingest.sentry.io/1',
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: 'congrats.example.com',
  NEXT_PUBLIC_COMPANY_NAME: 'Congrats LLC',
  NEXT_PUBLIC_SUPPORT_EMAIL: 'help@example.com',
};

describe('checkEnv', () => {
  it('enforces nothing outside production (local dev with an empty env)', () => {
    expect(checkEnv({})).toEqual({ errors: [], warnings: [] });
    expect(checkEnv({ NODE_ENV: 'development' })).toEqual({ errors: [], warnings: [] });
  });

  it('accepts a complete production env with no warnings', () => {
    expect(checkEnv(GOOD_PROD)).toEqual({ errors: [], warnings: [] });
  });

  it('reports every missing required var at once', () => {
    const { errors } = checkEnv({ NODE_ENV: 'production' });
    const joined = errors.join('\n');
    expect(errors).toHaveLength(4);
    for (const key of ['AUTH_SECRET', 'AUTH_URL', 'DATABASE_URL', 'INSTAPAY_HANDLE']) {
      expect(joined).toContain(key);
    }
  });

  it('rejects placeholder and short secrets', () => {
    expect(checkEnv({ ...GOOD_PROD, AUTH_SECRET: 'dev-secret-change-me-in-prod-0000000000000000000000' }).errors[0]).toMatch(
      /placeholder/,
    );
    expect(checkEnv({ ...GOOD_PROD, AUTH_SECRET: 'short' }).errors[0]).toMatch(/too short/);
  });

  it('rejects a malformed AUTH_URL and warns on public http', () => {
    expect(checkEnv({ ...GOOD_PROD, AUTH_URL: 'congrats.example.com' }).errors[0]).toMatch(/AUTH_URL/);
    const r = checkEnv({ ...GOOD_PROD, AUTH_URL: 'http://congrats.example.com' });
    expect(r.errors).toEqual([]);
    expect(r.warnings[0]).toMatch(/https/);
    expect(checkEnv({ ...GOOD_PROD, AUTH_URL: 'http://localhost:3000' }).warnings).toEqual([]);
  });

  it('allows the PGlite demo only when explicitly opted in', () => {
    const noDb = { ...GOOD_PROD, DATABASE_URL: undefined };
    expect(checkEnv(noDb).errors[0]).toMatch(/DATABASE_URL/);
    const optIn = checkEnv({ ...noDb, ALLOW_PGLITE_IN_PRODUCTION: 'true' });
    expect(optIn.errors).toEqual([]);
    expect(optIn.warnings[0]).toMatch(/PGlite/);
  });

  it('only warns for optional integrations', () => {
    const { errors, warnings } = checkEnv({
      NODE_ENV: 'production',
      AUTH_SECRET: GOOD_PROD.AUTH_SECRET,
      AUTH_URL: GOOD_PROD.AUTH_URL,
      DATABASE_URL: GOOD_PROD.DATABASE_URL,
      INSTAPAY_HANDLE: GOOD_PROD.INSTAPAY_HANDLE,
    });
    expect(errors).toEqual([]);
    const joined = warnings.join('\n');
    for (const key of [
      'RESEND_API_KEY',
      'SENTRY_DSN',
      'NEXT_PUBLIC_PLAUSIBLE_DOMAIN',
      'NEXT_PUBLIC_COMPANY_NAME',
      'NEXT_PUBLIC_SUPPORT_EMAIL',
    ]) {
      expect(joined).toContain(key);
    }
  });
});

describe('assertEnv', () => {
  it('throws with a combined message in production', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => assertEnv({ NODE_ENV: 'production' })).toThrow(/Invalid production environment/);
    err.mockRestore();
    warn.mockRestore();
  });

  it('does not throw in development', () => {
    expect(() => assertEnv({ NODE_ENV: 'development' })).not.toThrow();
  });
});

describe('checkEnv on Vercel', () => {
  const base = {
    NODE_ENV: 'production',
    VERCEL: '1',
    AUTH_SECRET: 'x'.repeat(40),
    AUTH_URL: 'https://congrats.vercel.app',
    DATABASE_URL: 'postgres://u:p@h/db',
    INSTAPAY_HANDLE: 'shop@instapay',
  };
  it('refuses local storage, which would lose every upload', () => {
    expect(checkEnv(base).errors.join(' ')).toMatch(/STORAGE_DRIVER=vercel-blob/);
  });
  it('needs the Blob token once the driver is set', () => {
    expect(checkEnv({ ...base, STORAGE_DRIVER: 'vercel-blob' }).errors.join(' ')).toMatch(/BLOB_READ_WRITE_TOKEN/);
    expect(checkEnv({ ...base, STORAGE_DRIVER: 'vercel-blob', BLOB_READ_WRITE_TOKEN: 't' }).errors).toEqual([]);
  });
  it('refuses PGlite even when explicitly allowed', () => {
    const env = { ...base, STORAGE_DRIVER: 'vercel-blob', BLOB_READ_WRITE_TOKEN: 't', DATABASE_URL: '', ALLOW_PGLITE_IN_PRODUCTION: 'true' };
    expect(checkEnv(env).errors.join(' ')).toMatch(/Postgres/);
  });
});
