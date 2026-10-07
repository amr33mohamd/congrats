import { getTranslations } from 'next-intl/server';
import { Quiz, type QuizTemplate } from '@/components/quiz/Quiz';
import type { Occasion } from '@/lib/quiz/answers';

/**
 * The questionnaire as the home page's main entry point, right under the hero:
 * the first question is on the page, and tapping an occasion carries on in
 * place through to the matched design playing with the visitor's names.
 * The hero's primary button scrolls here (#quiz).
 */
export async function HomeQuiz({
  templates,
  locale,
  signedIn,
  whatsappHref,
  initialOccasion,
}: {
  templates: QuizTemplate[];
  locale: 'ar' | 'en';
  signedIn: boolean;
  whatsappHref: string | null;
  initialOccasion?: Occasion;
}) {
  const t = await getTranslations('quiz.home');
  return (
    <section id="quiz" aria-labelledby="quiz-heading" className="scroll-mt-20 bg-surface-2 pb-16 pt-token-8">
      <div className="mx-auto max-w-xl px-token-4">
        <div className="text-center">
          <h2 id="quiz-heading" className="font-heading text-[clamp(1.9rem,6vw,2.75rem)] font-extrabold tracking-tight text-ink">
            <span aria-hidden className="me-2">✨</span>
            {t('title')}
          </h2>
          <p className="mx-auto mt-token-2 max-w-md text-muted">{t('subtitle')}</p>
        </div>
        <div className="mt-token-6 rounded-2xl border border-border bg-surface-2 p-token-4 shadow-[0_20px_60px_-30px_rgb(0_0_0_/_0.6)] sm:p-token-6">
          <Quiz
            embedded
            source="home"
            templates={templates}
            locale={locale}
            signedIn={signedIn}
            whatsappHref={whatsappHref}
            initialOccasion={initialOccasion}
          />
        </div>
      </div>
    </section>
  );
}
