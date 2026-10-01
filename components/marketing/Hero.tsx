import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { HeroCanvas } from '@/components/three/HeroCanvas';

/**
 * The hero is a "stage": a WebGL deck of cards floating behind the copy (a
 * static poster of the same deck without WebGL or with reduced motion). The
 * scrim is what makes the headline legible over the scene — direction-aware on
 * desktop so the gradient falls behind the text in both AR (RTL) and EN (LTR),
 * and a flat wash on phones, where the copy is centred over the deck.
 */
export async function Hero({ locale }: { locale: 'ar' | 'en' }) {
  const t = await getTranslations('marketing.hero');
  const isAr = locale === 'ar';

  return (
    <section className="relative isolate min-h-[92svh] overflow-hidden bg-[#150C11] text-white">
      {/* colour wash behind the scene */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(75% 55% at 50% 8%, rgb(var(--c-brand-500) / 0.42), transparent 68%),' +
            'radial-gradient(45% 45% at 88% 78%, rgb(var(--c-gold-500) / 0.30), transparent 70%),' +
            'radial-gradient(55% 50% at 6% 60%, rgb(var(--c-brand-700) / 0.45), transparent 72%)',
        }}
      />

      {/* the WebGL deck */}
      <HeroCanvas shift={isAr ? -1.5 : 1.5} />

      {/* phones: copy is centred over the deck, so dim the whole stage */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[rgb(21_12_17/0.72)] md:hidden" />

      {/* desktop: legibility scrim, anchored to whichever side the copy sits on */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background: `linear-gradient(to ${isAr ? 'left' : 'right'}, rgb(21 12 17 / 0.92) 0%, rgb(21 12 17 / 0.72) 34%, transparent 62%)`,
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[92svh] max-w-6xl items-center px-token-4 py-16">
        <div className="max-w-xl text-center md:text-start">
          <span className="inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-token-3 py-token-1 text-sm font-medium text-white/90 backdrop-blur-md">
            <span aria-hidden>✨</span>
            {t('eyebrow')}
          </span>

          <h1 className="mt-token-4 font-heading text-[clamp(2.25rem,7vw,4.75rem)] font-extrabold leading-[1.05] tracking-tight">
            {t('title')}
          </h1>

          <p className="mx-auto mt-token-4 max-w-prose text-lg leading-relaxed text-white/75 md:mx-0">
            {t('subtitle')}
          </p>

          <div className="mt-token-8 flex flex-col items-center gap-token-3 sm:flex-row md:justify-start">
            <Link
              href="/dashboard"
              className="w-full rounded-pill bg-brand px-token-8 py-token-4 text-center text-base font-semibold text-white shadow-[0_10px_40px_-8px_rgb(240_67_110_/_0.7)] transition-transform duration-[var(--motion-base)] ease-emphasized hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            >
              {t('ctaPrimary')}
            </Link>
            <Link
              href="/templates"
              className="w-full rounded-pill border border-white/25 bg-white/10 px-token-8 py-token-4 text-center text-base font-semibold text-white backdrop-blur-md transition-colors duration-[var(--motion-base)] hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            >
              {t('ctaSecondary')}
            </Link>
          </div>

          <p className="mt-token-6 text-sm text-white/55">{t('trust')}</p>
        </div>
      </div>

      {/* fade into the page surface below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{ background: 'linear-gradient(to bottom, transparent, rgb(var(--color-surface-2)))' }}
      />
    </section>
  );
}
