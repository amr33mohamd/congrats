import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// Security headers applied to every response. Safe defaults that don't break the
// app (no restrictive CSP that would block framer-motion / Google Fonts /
// Unsplash). Tighten with a full CSP once script sources are audited.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS is only honoured over HTTPS; harmless on http/localhost.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Templates use arbitrary Unsplash URLs and users can set avatar URLs, so
    // remote images come from many hosts — restricted to HTTPS only.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // PGlite ships wasm + must stay external in server bundles.
  serverExternalPackages: ['@electric-sql/pglite', 'postgres'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
