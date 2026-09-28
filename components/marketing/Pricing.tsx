import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui';
import { cn } from '@/components/ui/cn';

function Plan({
  name,
  price,
  tagline,
  features,
  cta,
  href,
  featured,
  badge,
}: {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border p-token-6 shadow-[var(--shadow-card)]',
        featured ? 'border-brand bg-surface ring-2 ring-brand/30' : 'border-border bg-surface',
      )}
    >
      {badge ? (
        <span className="absolute -top-3 inset-inline-end-token-6">
          <Badge tone="brand">{badge}</Badge>
        </span>
      ) : null}
      <h3 className="font-heading text-lg font-semibold text-ink">{name}</h3>
      <p className="mt-token-1 text-sm text-muted">{tagline}</p>
      <p className="mt-token-4 font-heading text-3xl font-extrabold text-ink">{price}</p>
      <ul className="mb-token-6 mt-token-6 flex flex-col gap-token-3 text-sm text-ink">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-token-2">
            <span aria-hidden className="mt-0.5 text-success">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {/* A styled link, not <Link><Button>: a button inside an anchor is
          invalid HTML and gives keyboard users two tab stops for one action. */}
      <Link
        href={href}
        className={cn(
          'mt-auto inline-flex h-11 w-full items-center justify-center rounded-pill px-5 text-base font-medium transition-colors duration-[var(--motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          featured
            ? 'bg-brand text-white shadow-[var(--shadow-card)] hover:bg-brand-hover'
            : 'border border-border bg-surface-2 text-ink hover:bg-white/10',
        )}
      >
        {cta}
      </Link>
    </div>
  );
}

export async function Pricing() {
  const t = await getTranslations('marketing.pricing');

  return (
    <section id="pricing" className="scroll-mt-20 bg-surface-2 py-16">
      <div className="mx-auto max-w-5xl px-token-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-ink md:text-4xl">{t('title')}</h2>
          <p className="mt-token-3 text-muted">{t('subtitle')}</p>
        </div>

        <div className="mx-auto mt-token-8 grid max-w-3xl gap-token-6 md:grid-cols-2">
          <Plan
            name={t('free.name')}
            price={t('free.price')}
            tagline={t('free.tagline')}
            features={t.raw('free.features') as string[]}
            cta={t('free.cta')}
            href="/dashboard"
          />
          <Plan
            featured
            badge={t('premium.badge')}
            name={t('premium.name')}
            price={t('premium.price')}
            tagline={t('premium.tagline')}
            features={t.raw('premium.features') as string[]}
            cta={t('premium.cta')}
            href="/templates"
          />
        </div>
      </div>
    </section>
  );
}
