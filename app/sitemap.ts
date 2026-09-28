import type { MetadataRoute } from 'next';

const base = (process.env.AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// Public, indexable marketing routes (both locales). Private app routes and
// per-user share links are intentionally excluded.
// NOTE: '/pricing' is an anchor on the home page, not a route — listing it
// here published two URLs that 404'd. '/templates' is a real page.
const paths = ['', '/templates', '/privacy', '/terms', '/refunds', '/contact'];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of ['en', 'ar'] as const) {
    for (const p of paths) {
      entries.push({
        url: `${base}/${locale}${p}`,
        changeFrequency: 'weekly',
        priority: p === '' ? 1 : 0.6,
        alternates: {
          languages: {
            en: `${base}/en${p}`,
            ar: `${base}/ar${p}`,
          },
        },
      });
    }
  }
  return entries;
}
