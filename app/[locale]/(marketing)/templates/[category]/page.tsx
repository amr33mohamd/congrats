import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { Link } from '@/i18n/navigation';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { OccasionLinks } from '@/components/marketing/OccasionLinks';
import { localeFirst, toCards } from '@/components/marketing/gallery-cards';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { listGalleryTemplates } from '@/server/public/templates-gallery';
import { CATALOG_CATEGORIES } from '@/content/templates/categories';
import { marketingMetadata } from '@/lib/site';
import { closestSlug } from '@/lib/closest-slug';
import { CATEGORY_OCCASION, quizHref } from '@/lib/quiz/links';

// Always rendered per request: the header reflects the visitor's session and
// the templates come from the live catalog, so a build-time prerender would
// freeze both. Stated explicitly rather than relying on getSession() happening
// to read request headers.
export const dynamic = 'force-dynamic';

/**
 * Per-occasion landing page: /[locale]/templates/<category>.
 *
 * Exists for search. Each page carries its own localized title and H1 aimed at
 * the phrase people actually type for that occasion (launch-kit/seo-keywords.md),
 * a canonical + hreflang pair, and the occasion's real templates as live tiles —
 * so the landing page IS the shop window, not a doorway to it.
 *
 * Only catalog categories render. A near-miss (a typo in a shared link) redirects
 * to the category it meant; anything else goes to the full gallery — never an
 * empty page that search engines would index as thin content, and never a 404
 * for someone who tapped a link in a chat.
 */

const KNOWN = new Set<string>(CATALOG_CATEGORIES.map((c) => c.slug));

function isKnown(slug: string): boolean {
  return KNOWN.has(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isKnown(category)) return {};
  const l = locale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale: l, namespace: `marketing.landing.${category}` });
  return marketingMetadata({
    locale: l,
    path: `/templates/${category}`,
    title: t('title'),
    description: t('description'),
  });
}

export default async function OccasionLandingPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  if (!isKnown(category)) {
    const match = closestSlug(category, [...KNOWN]);
    redirect(match ? `/${locale}/templates/${match}` : `/${locale}/templates`);
  }
  setRequestLocale(locale);
  const typed = (locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en';

  const [t, tl, tq, session, rows] = await Promise.all([
    getTranslations('marketing.templates'),
    getTranslations(`marketing.landing.${category}`),
    getTranslations('quiz.entry'),
    getSession(),
    listGalleryTemplates(),
  ]);
  // Undecided visitors: the questionnaire with this occasion already picked.
  const quizOccasion = CATEGORY_OCCASION[category];

  const mine = localeFirst(
    rows.filter((r) => r.categorySlug === category),
    typed,
  );
  const cards = toCards(mine, { locale: typed, sampleName: t('sampleName'), freeLabel: t('free') });

  const others = CATALOG_CATEGORIES.filter(
    (c) => c.slug !== category && rows.some((r) => r.categorySlug === c.slug),
  ).map((c) => ({ slug: c.slug, label: typed === 'ar' ? c.nameAr : c.nameEn }));

  return (
    <div className="min-h-[100dvh] bg-surface-2">
      <SiteHeader isAuthed={Boolean(session)} overDark />
      <main className="pt-24">
        <div className="mx-auto max-w-7xl px-token-4 pb-20">
          <nav aria-label={t('breadcrumbLabel')} className="text-center text-sm text-white/45">
            <Link href="/templates" className="transition-colors hover:text-white">
              {t('backToAll')}
            </Link>
          </nav>

          <div className="mx-auto mt-token-3 max-w-2xl text-center">
            <h1 className="font-heading text-[clamp(1.9rem,4.5vw,3rem)] font-bold tracking-tight text-white">
              {tl('h1')}
            </h1>
            <p className="mt-token-3 text-white/65">{tl('intro')}</p>
            <p className="mt-token-2 text-sm text-white/40">{t('hint')}</p>
          </div>

          {quizOccasion ? (
            <Link
              href={quizHref(quizOccasion, 'occasion')}
              data-testid="occasion-quiz-card"
              className="mx-auto mt-token-6 flex max-w-2xl items-center gap-token-4 rounded-2xl border border-brand/40 bg-brand/10 p-token-4 text-start transition-colors hover:border-brand hover:bg-brand/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span aria-hidden className="text-3xl">
                ✨
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-base font-bold text-white">{tq('occasionTitle')}</span>
                <span className="mt-1 block text-sm text-white/65">{tq('occasionBody')}</span>
              </span>
              <span className="shrink-0 rounded-pill bg-brand px-token-4 py-token-2 text-sm font-semibold text-white">
                {tq('occasionCta')}
              </span>
            </Link>
          ) : null}

          {cards.length === 0 ? (
            <p className="mt-token-8 text-center text-white/55">{t('empty')}</p>
          ) : (
            <div className="mt-token-8 grid grid-cols-2 gap-token-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {cards.map((card) => (
                <TemplateCard key={card.slug} data={card} popularLabel={t('popular')} />
              ))}
            </div>
          )}

          <div className="mt-token-8 flex justify-center">
            <Link
              href="/dashboard"
              className="rounded-pill bg-brand px-token-8 py-token-3 text-base font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t('cta')}
            </Link>
          </div>

          <OccasionLinks heading={t('moreHeading')} items={others} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
