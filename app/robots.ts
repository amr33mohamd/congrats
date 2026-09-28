import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Rendered per request so the absolute URLs use the runtime origin (AUTH_URL).
// Prerendered at build, they baked in whatever the build machine had —
// http://localhost:3000 when the build ran without AUTH_URL.
export const dynamic = 'force-dynamic';

// Private app areas and auth flows. Prefix rules, so each also covers its
// sub-pages (/ar/dashboard/..., /ar/admin/...).
const privatePrefixes = ['dashboard', 'admin', 'builder', 'login', 'forgot', 'reset'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          ...privatePrefixes.flatMap((p) => [`/ar/${p}`, `/en/${p}`]),
          // Per-user share links are personal cards: nobody should find
          // someone's invitation through a search engine because the link was
          // posted somewhere public. Trailing slash matters — a bare `/ar/p`
          // prefix would also block /ar/privacy.
          '/ar/p/',
          '/en/p/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
