import type { TemplateCardData } from '@/components/templates/TemplateCard';
import type { GalleryFilter } from '@/components/templates/TemplateGallery';
import type { GalleryTemplate } from '@/server/public/templates-gallery';
import { buildPreviewExperience } from '@/lib/template-preview';

/**
 * Gallery rows → card props, shared by the full gallery and the per-occasion
 * landing pages so both show exactly the same tiles and prices.
 */

/** Piastres → a localized EGP price, matching the pricing section's phrasing. */
export function formatPrice(piastres: number, locale: 'ar' | 'en'): string {
  const egp = piastres / 100;
  const n = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    maximumFractionDigits: egp % 1 === 0 ? 0 : 2,
  }).format(egp);
  return locale === 'ar' ? `${n} جنيه` : `EGP ${n}`;
}

export function toCards(
  rows: GalleryTemplate[],
  opts: { locale: 'ar' | 'en'; sampleName: string; freeLabel: string },
): TemplateCardData[] {
  const isAr = opts.locale === 'ar';
  return rows.map((r) => ({
    slug: r.slug,
    title: (r.locale === 'ar' ? r.titleAr : r.titleEn) ?? r.titleEn ?? r.slug,
    categorySlug: r.categorySlug ?? 'other',
    categoryLabel: (isAr ? r.categoryNameAr : r.categoryNameEn) ?? r.categorySlug ?? '',
    locale: r.locale,
    isPaid: r.isPaid,
    priceLabel: r.isPaid ? formatPrice(r.pricePiastres, opts.locale) : opts.freeLabel,
    // There is no "new" flag in the schema, so the badge marks the paid
    // templates — the ones worth leading with — instead of recency.
    popular: r.isPaid,
    experience: buildPreviewExperience(r.definition, {
      templateId: r.id,
      category: r.categorySlug ?? undefined,
      recipientName: opts.sampleName,
    }),
  }));
}

/** One chip per occasion that actually has a published template, catalog order. */
export function toFilters(rows: GalleryTemplate[], locale: 'ar' | 'en'): GalleryFilter[] {
  const seen = new Set<string>();
  return rows.flatMap((r) => {
    const slug = r.categorySlug;
    if (!slug || seen.has(slug)) return [];
    seen.add(slug);
    return [{ slug, label: (locale === 'ar' ? r.categoryNameAr : r.categoryNameEn) ?? slug }];
  });
}

/**
 * Templates in the visitor's language first. Search traffic to /ar/… wants an
 * Arabic card; the other language stays visible below rather than hidden.
 * Stable, so the catalog order is kept within each language.
 */
export function localeFirst<T extends { locale: 'ar' | 'en' }>(rows: T[], locale: 'ar' | 'en'): T[] {
  return [...rows.filter((r) => r.locale === locale), ...rows.filter((r) => r.locale !== locale)];
}
