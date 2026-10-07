import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { loadQuizTemplates } from '@/server/public/quiz-templates';
import { parseOccasion, parseStartSource } from '@/lib/quiz/links';
import { marketingMetadata, supportWhatsappHref } from '@/lib/site';
import { Quiz } from '@/components/quiz/Quiz';

/**
 * /start — the ad landing page. Six one-tap questions, then the visitor's own
 * invitation playing with their names in it, and two ways forward: build it
 * themselves, or hand it to us on WhatsApp.
 *
 * `?occasion=<key>` (from an occasion gallery or a product page, with
 * `&from=occasion|product`) skips the first question.
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

export default async function StartPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const l = locale === 'ar' ? 'ar' : 'en';
  const [templates, session] = await Promise.all([loadQuizTemplates(l), getSession()]);

  return (
    <Quiz
      templates={templates}
      locale={l}
      signedIn={Boolean(session)}
      whatsappHref={supportWhatsappHref()}
      source={parseStartSource(query.from)}
      initialOccasion={parseOccasion(query.occasion)}
    />
  );
}
