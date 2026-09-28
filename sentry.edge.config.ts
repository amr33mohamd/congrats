/**
 * Sentry for the Edge runtime (middleware). Imported by instrumentation.ts only
 * when SENTRY_DSN is set.
 */
import * as Sentry from '@sentry/nextjs';
import { sentryPrivacyOptions, tracesSampleRate } from './sentry.shared.config';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  tracesSampleRate: tracesSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
  ...sentryPrivacyOptions,
});
