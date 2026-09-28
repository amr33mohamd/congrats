import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { BoundExperience } from '@/lib/template-contract';
import { InvitationPreview } from './InvitationPreview';

const features = [
  { key: 'families', icon: '💍' },
  { key: 'event', icon: '🗓️' },
  { key: 'venue', icon: '📍' },
  { key: 'rsvp', icon: '💬' },
  { key: 'gift', icon: '🎁' },
  { key: 'styles', icon: '✒️' },
] as const;

/**
 * Home-page spotlight for one-page wedding invitations — the flagship format.
 * Every feature listed here maps to a real invitation section (Families,
 * Event, Venue, Rsvp, Gift), so the copy can't drift from the product.
 *
 * `preview` is a live invitation template when one is published; without it
 * the section still stands on its copy alone.
 */
export async function Invitations({ preview }: { preview: BoundExperience | null }) {
  const t = await getTranslations('marketing.invitations');

  return (
    <section id="invitations" className="relative isolate scroll-mt-20 overflow-hidden py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 50% at 80% 30%, rgb(var(--c-gold-500) / 0.14), transparent 70%),' +
            'radial-gradient(50% 45% at 15% 80%, rgb(var(--c-brand-700) / 0.22), transparent 70%)',
        }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-token-8 px-token-4 md:grid-cols-[1fr_auto] md:gap-16">
        <div>
          <span className="inline-flex items-center rounded-pill border border-gold/30 bg-gold/10 px-token-3 py-token-1 text-xs font-semibold uppercase tracking-wide text-gold">
            {t('eyebrow')}
          </span>
          <h2 className="mt-token-4 font-heading text-[clamp(1.9rem,4vw,2.75rem)] font-bold leading-tight tracking-tight text-ink">
            {t('title')}
          </h2>
          <p className="mt-token-3 max-w-prose text-lg text-muted">{t('subtitle')}</p>

          <ul className="mt-token-8 grid gap-token-4 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f.key} className="flex gap-token-3">
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-lg ring-1 ring-border"
                >
                  {f.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading text-base font-semibold text-ink">
                    {t(`features.${f.key}.title`)}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted">{t(`features.${f.key}.body`)}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/templates/invitation"
            className="mt-token-8 inline-flex w-full items-center justify-center rounded-pill bg-brand px-token-8 py-token-3 text-base font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
          >
            {t('cta')}
          </Link>
        </div>

        {preview ? (
          <div className="md:w-[280px]">
            <InvitationPreview experience={preview} label={t('previewLabel')} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
