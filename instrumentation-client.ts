/**
 * Browser-side Sentry. NEXT_PUBLIC_SENTRY_DSN is inlined at BUILD time (see
 * next.config.mjs, which falls back to SENTRY_DSN). When it is empty the branch
 * below is dead code, so visitors never download the SDK.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void Promise.all([import('@sentry/nextjs'), import('./sentry.shared.config')]).then(
    ([Sentry, { sentryPrivacyOptions }]) => {
      Sentry.init({
        dsn,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
        tracesSampleRate: 0,
        // Session replay would record recipients' names and photos — keep it off.
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        ...sentryPrivacyOptions,
      });
    },
  );
}
