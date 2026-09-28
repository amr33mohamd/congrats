import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';

// Pin the tracing root to this project. Without it Next walks up looking for
// lockfiles and, when the repo sits inside another folder with its own
// package-lock.json (git worktrees, monorepo checkouts), warns about an
// "inferred workspace root" and may trace files from the wrong directory.
const projectRoot = fileURLToPath(new URL('.', import.meta.url));

// ── Build-time integrations ──────────────────────────────────────────────────
// NEXT_PUBLIC_* values are inlined into the client bundle and these headers are
// written into the build manifest, so both must be present when `next build`
// runs (Docker: pass them as build args — see Dockerfile / DEPLOY.md).
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || '';
const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '';
const plausibleHost = (process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || 'https://plausible.io').replace(/\/$/, '');

/** Origin + CSP report endpoint derived from a Sentry DSN (https://KEY@HOST/PROJECT). */
function sentryEndpoints(dsn) {
  try {
    const u = new URL(dsn);
    const project = u.pathname.replace(/^\//, '');
    return {
      origin: u.origin,
      report: `${u.origin}/api/${project}/security/?sentry_key=${u.username}`,
    };
  } catch {
    return null;
  }
}
const sentry = sentryDsn ? sentryEndpoints(sentryDsn) : null;

// ── Content-Security-Policy ──────────────────────────────────────────────────
// Why each source is needed:
//  - script 'unsafe-inline': the App Router streams RSC payloads as inline
//    <script> tags. The nonce alternative forces every page to render
//    dynamically (no static /ar, /en), which costs more than it buys here.
//    Third-party script hosts are still locked down to Plausible only.
//  - script 'unsafe-eval' (dev only): React Refresh / webpack HMR use eval.
//  - style 'unsafe-inline': framer-motion and React `style={}` props write
//    inline styles; next/font injects an inline @font-face block.
//  - fonts.googleapis.com / fonts.gstatic.com: lib/fonts.ts loads template
//    display faces from Google Fonts at runtime.
//  - img https://images.unsplash.com: template artwork. data:/blob: cover the
//    SVG noise texture in SceneBackground and local upload previews
//    (URL.createObjectURL). Everything else is served from 'self'
//    (/api/storage, /_next/image).
//  - worker/child blob: three.js / image decoding helpers may spin up blob
//    workers; WebGL itself needs no CSP source.
//  - ws: (dev only): HMR websocket.
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []), ...(plausibleDomain ? [plausibleHost] : [])],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'],
  'media-src': ["'self'", 'data:', 'blob:'],
  'connect-src': [
    "'self'",
    ...(plausibleDomain ? [plausibleHost] : []),
    ...(sentry ? [sentry.origin] : []),
    ...(isDev ? ['ws:', 'wss:'] : []),
  ],
  'worker-src': ["'self'", 'blob:'],
  'child-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
  ...(sentry ? { 'report-uri': [sentry.report] } : {}),
};
const serializeCsp = (d) =>
  Object.entries(d)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ');

// The full policy ships as Report-Only until it has been exercised in a real
// browser across every page (player, editor uploads, admin, 3D hero):
// violations are logged to the console (and to Sentry when a DSN is set) but
// nothing is blocked. Build with CSP_ENFORCE=true to enforce it.
// The small enforced policy below cannot break rendering — it only blocks
// plugins, <base> hijacking and framing by other sites — so it is always on.
const cspEnforce = process.env.CSP_ENFORCE === 'true';
const fullCsp = serializeCsp(cspDirectives);
const baselineCsp = "object-src 'none'; base-uri 'self'; frame-ancestors 'self'";

// Security headers applied to every response.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS is only honoured over HTTPS; harmless on http/localhost.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  ...(cspEnforce
    ? [{ key: 'Content-Security-Policy', value: fullCsp }]
    : [
        { key: 'Content-Security-Policy', value: baselineCsp },
        { key: 'Content-Security-Policy-Report-Only', value: fullCsp },
      ]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: projectRoot,
  images: {
    // Templates use arbitrary Unsplash URLs and users can set avatar URLs, so
    // remote images come from many hosts — restricted to HTTPS only.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // PGlite ships wasm + must stay external in server bundles.
  serverExternalPackages: ['@electric-sql/pglite', 'postgres'],
  // Expose one DSN to the browser bundle so operators only set SENTRY_DSN.
  env: { NEXT_PUBLIC_SENTRY_DSN: sentryDsn },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

let config = withNextIntl(nextConfig);

// Sentry's build plugin is only wired in when a DSN is configured, so builds
// without Sentry are byte-for-byte unaffected. Source maps are uploaded only
// when SENTRY_AUTH_TOKEN is present; without it the build never fails or
// tries to reach sentry.io.
if (sentryDsn) {
  // SDK v11 ships the build wrapper from a separate entry point.
  const { withSentryConfig } = await import('@sentry/nextjs/config');
  config = withSentryConfig(config, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    telemetry: false,
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
    // We only init tracing-free Sentry, so skip the router-transition hook nag.
    suppressOnRouterTransitionStartWarning: true,
  });
}

export default config;
