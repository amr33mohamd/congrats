/**
 * Sentry options shared by the server, edge and browser configs.
 *
 * Privacy first: cards carry recipients' names and photos, share slugs are
 * capability URLs, and payment proofs are sensitive. So we collect stack
 * traces and nothing about the person — no user info, cookies, bodies, query
 * strings, DB query data or local variables. Only the user agent is kept
 * because it is what makes browser-specific bugs debuggable.
 */
import type { init } from '@sentry/nextjs';

type Options = NonNullable<Parameters<typeof init>[0]>;

export const sentryPrivacyOptions = {
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: { allow: ['user-agent'] }, response: false },
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
    genAI: { inputs: false, outputs: false },
  },
} satisfies Partial<Options>;

/** Parses SENTRY_TRACES_SAMPLE_RATE; tracing is off unless explicitly enabled. */
export function tracesSampleRate(raw: string | undefined): number {
  const n = Number(raw ?? 0);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0;
}
