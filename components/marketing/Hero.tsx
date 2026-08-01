import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui';
import { HeroDemo } from './HeroDemo';

export async function Hero({ locale }: { locale: 'ar' | 'en' }) {
  const t = await getTranslations('marketing.hero');
  const recipient = t('demoRecipient');

  return (
    <section className="relative overflow-hidden">
      {/* ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 50% at 50% -10%, rgb(var(--c-brand-300) / 0.35), transparent 70%), radial-gradient(40% 40% at 90% 10%, rgb(var(--c-gold-300) / 0.25), transparent 70%)',
        }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-token-8 px-token-4 py-token-8 md:grid-cols-2 md:py-16">
        <div className="text-center md:text-start">
          <span className="inline-flex items-center gap-2 rounded-pill border border-brand/20 bg-brand/10 px-token-3 py-token-1 text-sm font-medium text-brand-strong">
            <span aria-hidden>✨</span>
            {t('eyebrow')}
          </span>
          <h1 className="mt-token-4 font-heading text-4xl font-extrabold leading-[1.1] text-ink md:text-6xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-token-4 max-w-prose text-lg text-muted md:mx-0">
            {t('subtitle')}
          </p>
          <div className="mt-token-6 flex flex-col items-center gap-token-3 sm:flex-row md:justify-start">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                {t('ctaPrimary')}
              </Button>
            </Link>
            <a href="#how" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                {t('ctaSecondary')}
              </Button>
            </a>
          </div>
          <p className="mt-token-4 text-sm text-muted">{t('trust')}</p>
        </div>

        <div className="relative">
          <div className="absolute -top-3 inset-inline-start-0 z-10 mx-auto flex w-fit items-center gap-2 rounded-pill bg-ink/90 px-token-3 py-token-1 text-xs font-medium text-white shadow-[var(--shadow-card)] md:inset-inline-start-auto md:inset-inline-end-0">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
            {t('demoLabel')}
          </div>
          <HeroDemo locale={locale} recipientName={recipient} />
        </div>
      </div>
    </section>
  );
}
