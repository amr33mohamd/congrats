import { getTranslations } from 'next-intl/server';

const keys = ['q1', 'q2', 'q3', 'q4'] as const;

export async function Faq() {
  const t = await getTranslations('marketing.faq');

  return (
    <section id="faq" className="scroll-mt-20 py-16">
      <div className="mx-auto max-w-3xl px-token-4">
        <h2 className="text-center font-heading text-3xl font-bold text-ink md:text-4xl">
          {t('title')}
        </h2>
        <div className="mt-token-8 flex flex-col gap-token-3">
          {keys.map((k) => (
            <details
              key={k}
              className="group rounded-xl border border-border bg-surface p-token-4 shadow-[var(--shadow-card)] open:ring-1 open:ring-brand/20"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-token-3 font-heading text-base font-semibold text-ink">
                {t(`items.${k}.q`)}
                <span
                  aria-hidden
                  className="text-muted transition-transform duration-[var(--motion-base)] group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-token-3 text-muted">{t(`items.${k}.a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
