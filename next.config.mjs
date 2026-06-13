import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // PGlite ships wasm + must stay external in server bundles.
  serverExternalPackages: ['@electric-sql/pglite', 'postgres'],
};

export default withNextIntl(nextConfig);
