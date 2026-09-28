/**
 * Next.js instrumentation hook — runs once per server process before any
 * request is handled. Two jobs:
 *   1. Validate the production environment (lib/env.ts) so a misconfigured
 *      deploy fails loudly at boot instead of on the first login/payment.
 *   2. Start Sentry, but ONLY when SENTRY_DSN is set. Without a DSN nothing is
 *      initialised and error reporting is a complete no-op.
 */
import type { Instrumentation } from 'next';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // `next build` also loads this hook while prerendering; the build machine
    // (CI, Docker build stage) legitimately has no runtime secrets.
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      const { assertEnv } = await import('./lib/env');
      try {
        assertEnv();
      } catch {
        // assertEnv already printed the full list. Exit instead of throwing:
        // a thrown error here leaves `next start` alive, answering every
        // request with a 500 and re-logging the error on each one.
        process.exit(1);
      }
    }
    if (process.env.SENTRY_DSN) await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge' && process.env.SENTRY_DSN) {
    await import('./sentry.edge.config');
  }
}

// Reports errors thrown in server components, route handlers and server
// actions. Lazy import keeps the SDK off the hot path when Sentry is off.
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
};
