import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { TemplateGallery } from '@/components/templates/TemplateGallery';
import type { TemplateCardData } from '@/components/templates/TemplateCard';
import { listGalleryTemplates } from '@/server/public/templates-gallery';
import { buildPreviewExperience } from '@/lib/template-preview';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return {
    title: isAr ? 'القوالب | Congrats' : 'Templates | Congrats',
    description: isAr
      ? 'تصفّح قوالب التهاني المتحركة — أعياد ميلاد وأفراح وتخرّج والعيد — بالعربية والإنجليزية.'
      : 'Browse animated greeting templates — birthdays, weddings, graduation and Eid — in Arabic and English.',
    alternates: { canonical: `/${isAr ? 'ar' : 'en'}/templates` },
  };
}

/** Piastres → a localized EGP price, matching the pricing section's phrasing. */
function formatPrice(piastres: number, locale: 'ar' | 'en'): string {
  const egp = piastres / 100;
  const n = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    maximumFractionDigits: egp % 1 === 0 ? 0 : 2,
  }).format(egp);
  return locale === 'ar' ? `${n} جنيه` : `EGP ${n}`;
}

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isAr = locale === 'ar';
  const typed = (isAr ? 'ar' : 'en') as 'ar' | 'en';

  const [t, session, rows] = await Promise.all([
    getTranslations('marketing.templates'),
    getSession(),
    listGalleryTemplates(),
  ]);

  const sampleName = t('sampleName');

  const cards: TemplateCardData[] = rows.map((r) => ({
    slug: r.slug,
    title: (r.locale === 'ar' ? r.titleAr : r.titleEn) ?? r.titleEn ?? r.slug,
    categorySlug: r.categorySlug ?? 'other',
    categoryLabel: (isAr ? r.categoryNameAr : r.categoryNameEn) ?? r.categorySlug ?? '',
    locale: r.locale,
    isPaid: r.isPaid,
    priceLabel: r.isPaid ? formatPrice(r.pricePiastres, typed) : t('free'),
    // There is no "new" flag in the schema, so the badge marks the paid
    // templates — the ones worth leading with — instead of recency.
    popular: r.isPaid,
    experience: buildPreviewExperience(r.definition, {
      templateId: r.id,
      category: r.categorySlug ?? undefined,
      recipientName: sampleName,
    }),
  }));

  // One chip per occasion that actually has a published template, catalog order.
  const seen = new Set<string>();
  const filters = rows.flatMap((r) => {
    const slug = r.categorySlug;
    if (!slug || seen.has(slug)) return [];
    seen.add(slug);
    return [{ slug, label: (isAr ? r.categoryNameAr : r.categoryNameEn) ?? slug }];
  });

  return (
    <div className="min-h-[100dvh] bg-[#0C0A0B]">
      <SiteHeader isAuthed={Boolean(session)} overDark />
      <main className="pt-24">
        <div className="mx-auto max-w-7xl px-token-4 pb-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-heading text-[clamp(1.9rem,4.5vw,3rem)] font-bold tracking-tight text-white">
              {t('title')}
            </h1>
            <p className="mt-token-3 text-white/65">{t('subtitle')}</p>
            <p className="mt-token-2 text-sm text-white/40">{t('hint')}</p>
          </div>

          <TemplateGallery cards={cards} filters={filters} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
