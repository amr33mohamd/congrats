import { listGalleryTemplates } from '@/server/public/templates-gallery';
import { SITE_URL } from '@/lib/site';
import { namesParam } from '@/app/[locale]/t/[slug]/named';

/** A design the bot may offer. Price comes from the database, never from the prompt or the chat. */
export interface CatalogItem {
  slug: string;
  title: string;
  priceEgp: number;
}

/** Published Arabic wedding invitations, cheapest first. */
export async function invitationCatalog(): Promise<CatalogItem[]> {
  const all = await listGalleryTemplates();
  return all
    .filter((t) => t.locale === 'ar' && (t.definition.fields ?? []).some((f) => f.key === 'couple'))
    .map((t) => ({ slug: t.slug, title: t.titleAr || t.titleEn || t.slug, priceEgp: t.pricePiastres / 100 }))
    .sort((a, b) => a.priceEgp - b.priceEgp);
}

/** The design's share image with the names on it (the same one link previews show). */
export function previewImageUrl(slug: string, names: string): string {
  const n = namesParam(names) ?? '';
  return `${SITE_URL}/ar/t/${encodeURIComponent(slug)}/og?names=${encodeURIComponent(n)}`;
}

/** The watermarked preview link with the couple's names, as sent by hand today. */
export function previewUrl(slug: string, names: string): string {
  const n = namesParam(names) ?? '';
  // `+` for spaces keeps the link shorter; the page reads it back as a space.
  return `${SITE_URL}/ar/t/${encodeURIComponent(slug)}?names=${encodeURIComponent(n).replace(/%20/g, '+')}`;
}
