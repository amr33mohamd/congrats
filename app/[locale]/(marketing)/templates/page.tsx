import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { OccasionLinks } from '@/components/marketing/OccasionLinks';
import { toCards, toFilters } from '@/components/marketing/gallery-cards';
import { TemplateGallery } from '@/components/templates/TemplateGallery';
import { listGalleryTemplates } from '@/server/public/templates-gallery';
import { marketingMetadata } from '@/lib/site';

// Always rendered per request: the header reflects the visitor's session and
// the templates come from the live catalog, so a build-time prerender would
// freeze both. Stated explicitly rather than relying on getSession() happening
// to read request headers.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = locale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale: l, namespace: 'marketing.templates' });
  return marketingMetadata({
    locale: l,
    path: '/templates',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typed = (locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en';

  const [t, session, rows] = await Promise.all([
    getTranslations('marketing.templates'),
    getSession(),
    listGalleryTemplates(),
  ]);

  const cards = toCards(rows, { locale: typed, sampleName: t('sampleName'), freeLabel: t('free') });
  const filters = toFilters(rows, typed);

  return (
    <div className="min-h-[100dvh] bg-surface-2">
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

          <OccasionLinks heading={t('byOccasion')} items={filters} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
