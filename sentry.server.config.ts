/**
 * Sentry for the Node.js server runtime. Imported by instrumentation.ts only
 * when SENTRY_DSN is set.
 */
import * as Sentry from '@sentry/nextjs';
import { sentryPrivacyOptions, tracesSampleRate } from './sentry.shared.config';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  // Tracing is opt-in: errors are what we need; spans cost quota.
  tracesSampleRate: tracesSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
  ...sentryPrivacyOptions,
});
