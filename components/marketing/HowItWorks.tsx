import { getTranslations } from 'next-intl/server';

const steps = [
  { key: 'pick', emoji: '🎨' },
  { key: 'personalize', emoji: '✍️' },
  { key: 'share', emoji: '🔗' },
] as const;

export async function HowItWorks() {
  const t = await getTranslations('marketing.how');

  return (
    <section id="how" className="scroll-mt-20 py-16">
      <div className="mx-auto max-w-6xl px-token-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-ink md:text-4xl">{t('title')}</h2>
          <p className="mt-token-3 text-muted">{t('subtitle')}</p>
        </div>

        <ol className="mt-token-8 grid gap-token-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.key}
              className="relative rounded-xl border border-border bg-surface p-token-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-token-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-2xl" aria-hidden>
                  {s.emoji}
                </span>
                <span className="font-heading text-sm font-bold text-brand-strong">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-token-4 font-heading text-xl font-semibold text-ink">
                {t(`steps.${s.key}.title`)}
              </h3>
              <p className="mt-token-2 text-muted">{t(`steps.${s.key}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
