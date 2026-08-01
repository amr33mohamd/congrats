import type { MetadataRoute } from 'next';

const base = (process.env.AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Don't index private app areas or per-user share links.
        disallow: ['/api/', '/en/dashboard', '/ar/dashboard', '/en/admin', '/ar/admin', '/en/builder', '/ar/builder'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
