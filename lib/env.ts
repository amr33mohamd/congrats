/**
 * Boot-time environment validation.
 *
 * Called once from instrumentation.ts `register()` when the Node server starts.
 * In production a missing/placeholder REQUIRED var aborts the boot with one
 * clear message listing every problem at once (instead of the app starting and
 * failing later on the first login, payment or email). Optional integrations
 * only produce warnings so a minimal deploy still works.
 *
 * Outside production nothing is enforced: local dev and tests must keep working
 * with an empty environment (PGlite, dev secret, no email/analytics).
 */

type Env = Record<string, string | undefined>;

export type EnvReport = {
  /** Problems that make the production deploy unsafe or broken. */
  errors: string[];
  /** Missing optional integrations — the app degrades gracefully without them. */
  warnings: string[];
};

// Values that ship in .env.example / CI / Dockerfile. A production server must
// never sign sessions with a secret that is public in the repo.
const PLACEHOLDER_SECRET_MARKERS = ['change-me', 'build-time-placeholder', 'ci-placeholder'];
const MIN_SECRET_LENGTH = 32;

const isSet = (v: string | undefined): v is string => typeof v === 'string' && v.trim() !== '';
const isTrue = (v: string | undefined) => v === 'true' || v === '1';

function parseUrl(v: string): URL | null {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u : null;
  } catch {
    return null;
  }
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

/** Pure check — no side effects, so it is unit-testable with a fake env. */
export function checkEnv(env: Env = process.env): EnvReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (env.NODE_ENV !== 'production') return { errors, warnings };

  // ── Required ────────────────────────────────────────────────────────────
  const secret = env.AUTH_SECRET;
  if (!isSet(secret)) {
    errors.push('AUTH_SECRET is not set. Generate one with: openssl rand -base64 32');
  } else if (PLACEHOLDER_SECRET_MARKERS.some((m) => secret.includes(m))) {
    errors.push('AUTH_SECRET is a placeholder value from the repo. Generate a real one: openssl rand -base64 32');
  } else if (secret.length < MIN_SECRET_LENGTH) {
    errors.push(`AUTH_SECRET is too short (${secret.length} chars, need ≥ ${MIN_SECRET_LENGTH}).`);
  }

  const authUrl = env.AUTH_URL;
  if (!isSet(authUrl)) {
    errors.push('AUTH_URL is not set. Use the public URL of the site, e.g. https://congrats.example.com');
  } else {
    const u = parseUrl(authUrl);
    if (!u) {
      errors.push(`AUTH_URL is not a valid http(s) URL: "${authUrl}"`);
    } else if (u.protocol === 'http:' && !LOCAL_HOSTS.has(u.hostname)) {
      // Allowed (TLS may terminate at a proxy that rewrites), but canonical
      // URLs, OG tags and cookies should all be https in real production.
      warnings.push(`AUTH_URL uses http:// (${u.origin}). Use https:// for a public deploy.`);
    }
  }

  if (!isSet(env.DATABASE_URL)) {
    if (isTrue(env.ALLOW_PGLITE_IN_PRODUCTION)) {
      warnings.push(
        'DATABASE_URL is not set — running on in-process PGlite (ALLOW_PGLITE_IN_PRODUCTION=true). ' +
          'Fine for a single-container demo; use Postgres for real traffic.',
      );
    } else {
      errors.push(
        'DATABASE_URL is not set. Point it at Postgres, or set ALLOW_PGLITE_IN_PRODUCTION=true ' +
          'to knowingly run the single-container PGlite demo.',
      );
    }
  } else if (!/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) {
    errors.push('DATABASE_URL must start with postgres:// or postgresql://');
  }

  if (!isSet(env.INSTAPAY_HANDLE)) {
    errors.push('INSTAPAY_HANDLE is not set — buyers would have nowhere to pay for paid templates.');
  }

  // ── Optional (warn only) ────────────────────────────────────────────────
  if (!isSet(env.RESEND_API_KEY)) {
    warnings.push('RESEND_API_KEY is not set — password-reset emails are only logged server-side.');
  } else if (!isSet(env.EMAIL_FROM)) {
    warnings.push('EMAIL_FROM is not set — emails go out from the default sender address.');
  }
  if (!isSet(env.SENTRY_DSN)) {
    warnings.push('SENTRY_DSN is not set — error tracking is disabled.');
  }
  if (!isSet(env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN)) {
    warnings.push('NEXT_PUBLIC_PLAUSIBLE_DOMAIN is not set — analytics are disabled.');
  }
  for (const key of ['NEXT_PUBLIC_COMPANY_NAME', 'NEXT_PUBLIC_SUPPORT_EMAIL'] as const) {
    if (!isSet(env[key])) {
      warnings.push(`${key} is not set — legal/contact pages will show placeholder text.`);
    }
  }

  return { errors, warnings };
}

/**
 * Logs warnings and, in production, throws when a required var is wrong.
 * instrumentation.ts turns the throw into a process exit so the deploy fails
 * at boot rather than serving errors.
 */
export function assertEnv(env: Env = process.env): EnvReport {
  const report = checkEnv(env);
  for (const w of report.warnings) console.warn(`[env] warning: ${w}`);
  if (report.errors.length > 0) {
    const list = report.errors.map((e) => `  - ${e}`).join('\n');
    const message = `[env] Invalid production environment:\n${list}\nSee DEPLOY.md → "Environment variables".`;
    console.error(message);
    throw new Error(message);
  }
  return report;
}
