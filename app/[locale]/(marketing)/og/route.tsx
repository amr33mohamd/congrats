import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderOgCard } from '@/components/marketing/og-card';
import { locales } from '@/i18n/routing';

/**
 * The marketing pages' share card, served at /<locale>/og.
 *
 * Why a route handler and not the `opengraph-image` file convention:
 *  - the root convention file is served at /opengraph-image, a dot-less path
 *    the next-intl middleware redirects to /<locale>/opengraph-image — a 404;
 *  - under a route group the convention URL gets a build hash suffix, so it
 *    can't be referenced from metadata; and a page that sets its own
 *    `openGraph` (every marketing page does, for per-page titles) drops the
 *    inherited convention image anyway.
 * A plain, locale-prefixed, stable URL avoids all three; `marketingMetadata`
 * (lib/site.ts) points og:image and twitter:image here.
 *
 * Prerendered per locale at build time — the card has no per-request data.
 */
export const dynamic = 'force-static';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Arabic is a pre-rendered PNG: next/og (Satori) can't shape Arabic script,
// so scripts/render-og-ar.mjs draws it in Chromium.
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === 'ar') {
    const png = await readFile(join(process.cwd(), 'public/brand/og-ar.png'));
    return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
  }
  return renderOgCard();
}
