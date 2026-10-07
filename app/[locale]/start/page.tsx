import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { listGalleryTemplates } from '@/server/public/templates-gallery';
import { formatPrice } from '@/components/marketing/gallery-cards';
import { marketingMetadata, supportWhatsappHref } from '@/lib/site';
import { Quiz, type QuizTemplate } from '@/components/quiz/Quiz';

/**
 * /start — the ad landing page. Six one-tap questions, then the visitor's own
 * invitation playing with their names in it, and two ways forward: build it
 * themselves, or hand it to us on WhatsApp.
 *
 * Templates come from the live catalog (published only), so archiving a
 * design in the admin also takes it out of the quiz.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = locale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale: l, namespace: 'quiz.meta' });
  return marketingMetadata({ locale: l, path: '/start', title: t('title'), description: t('description') });
}

export default async function StartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale: l, namespace: 'quiz.result' });
  const [rows, session] = await Promise.all([listGalleryTemplates(), getSession()]);

  const templates: QuizTemplate[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    locale: r.locale,
    categorySlug: r.categorySlug,
    title: (l === 'ar' ? r.titleAr : r.titleEn) ?? r.titleEn ?? r.titleAr ?? r.slug,
    priceLabel: r.isPaid ? formatPrice(r.pricePiastres, l) : t('free'),
    definition: r.definition,
  }));

  return (
    <Quiz
      templates={templates}
      locale={l}
      signedIn={Boolean(session)}
      whatsappHref={supportWhatsappHref()}
    />
  );
}
