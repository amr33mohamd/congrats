import type { MetadataRoute } from 'next';
import { CATALOG_CATEGORIES } from '@/content/templates/categories';
import { SITE_URL } from '@/lib/site';
import { PRODUCTS } from '@/content/products';

// Rendered per request so the absolute URLs use the runtime origin (AUTH_URL).
// Prerendered at build, they baked in whatever the build machine had —
// http://localhost:3000 when the build ran without AUTH_URL.
export const dynamic = 'force-dynamic';

// Public, indexable marketing routes (both locales). Private app routes and
// per-user share links are intentionally excluded.
// NOTE: '/pricing' is an anchor on the home page, not a route — listing it
// here published two URLs that 404'd. '/templates' is a real page.
const staticPaths = ['', '/templates', '/privacy', '/terms', '/refunds', '/contact'];

// One landing page per catalog occasion (/templates/<slug>). Built from the
// catalog rather than the DB so the sitemap never depends on a live database.
const occasionPaths = CATALOG_CATEGORIES.map((c) => `/templates/${c.slug}`);

// Product landing pages (content/products.ts) and their index.
const productPaths = ['/products', ...PRODUCTS.map((p) => `/products/${p.slug}`)];

function priorityFor(p: string): number {
  if (p === '') return 1;
  if (p === '/templates' || p.startsWith('/templates/')) return 0.8;
  if (p.startsWith('/products')) return 0.7;
  return 0.4;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const p of [...staticPaths, ...occasionPaths, ...productPaths]) {
    for (const locale of ['ar', 'en'] as const) {
      entries.push({
        url: `${SITE_URL}/${locale}${p}`,
        changeFrequency: p.startsWith('/templates') || p.startsWith('/products') || p === '' ? 'weekly' : 'monthly',
        priority: priorityFor(p),
        alternates: {
          languages: {
            ar: `${SITE_URL}/ar${p}`,
            en: `${SITE_URL}/en${p}`,
            'x-default': `${SITE_URL}/ar${p}`,
          },
        },
      });
    }
  }
  return entries;
}
