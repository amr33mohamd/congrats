import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { WhatsAppIcon } from '@/components/marketing/WhatsAppButton';
import { InvitationPreview } from '@/components/marketing/InvitationPreview';
import { cn } from '@/components/ui/cn';
import type { BoundExperience } from '@/lib/template-contract';
import {
  PRODUCTS,
  ctaPath,
  startingPrice,
  whatsappHref,
  whatsappMessage,
  type Product,
  type ProductTier,
} from '@/content/products';
import { ProductCtaAnchor, ProductCtaLink, ProductView } from './tracking';
import { RsvpMock } from './RsvpMock';

type Loc = 'ar' | 'en';

const PRIMARY_BASE =
  'inline-flex min-h-11 items-center justify-center gap-token-2 rounded-pill bg-brand py-token-3 text-center font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
const BTN_PRIMARY = `${PRIMARY_BASE} px-token-6 text-base`;
// No text colour: callers add text-white (dark hero) or text-ink (cards).
const BTN_WA =
  'inline-flex min-h-11 items-center justify-center gap-token-2 rounded-pill border border-[#25D366]/50 bg-[#25D366]/10 px-token-6 py-token-3 text-center text-base font-semibold transition-colors hover:bg-[#25D366]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]';

export function formatEgp(n: number, locale: Loc): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG').format(n);
}

/**
 * A CTA button: in-app link, wa.me link, or — when the WhatsApp number isn't
 * configured — the contact page, so a WhatsApp-only product is never a dead end.
 */
function Cta({
  product,
  cta,
  path,
  wa,
  className,
  children,
}: {
  product: string;
  cta: string;
  path: string | null;
  wa: string | null;
  className: string;
  children: React.ReactNode;
}) {
  if (path) return <ProductCtaLink href={path} product={product} cta={cta} className={className}>{children}</ProductCtaLink>;
  if (wa) return <ProductCtaAnchor href={wa} product={product} cta={cta} className={className}>{children}</ProductCtaAnchor>;
  return <ProductCtaLink href="/contact" product={product} cta={cta} className={className}>{children}</ProductCtaLink>;
}

export async function ProductLanding({
  product: p,
  locale,
  demo,
  waBase,
  reviewWindow,
}: {
  product: Product;
  locale: Loc;
  demo: BoundExperience | null;
  /** https://wa.me/<digits>, or null when NEXT_PUBLIC_SUPPORT_WHATSAPP is unset. */
  waBase: string | null;
  reviewWindow: string;
}) {
  const t = await getTranslations('products.page');
  const tf = await getTranslations('products.faq');
  const L = (v: { ar: string; en: string }) => v[locale];

  const price = (n: number | null) =>
    n == null ? t('quote') : n === 0 ? t('free') : t('egp', { n: formatEgp(n, locale) });
  const start = startingPrice(p);
  const priceBadge = start == null ? t('quote') : start === 0 ? t('free') : t('from', { price: price(start) });

  const primaryPath = ctaPath(p.primary);
  const waGeneral = whatsappHref(waBase, whatsappMessage(p, locale));
  const isService = p.primary.kind === 'whatsapp';
  const hasSelf = p.tiers.some((x) => x.fulfilment === 'self');

  const faq = [
    ...p.faq.map((f) => ({ q: L(f.q), a: L(f.a) })),
    { q: tf('pay.q'), a: tf('pay.a', { review: reviewWindow }) },
    { q: tf('app.q'), a: tf('app.a') },
    hasSelf && !isService ? { q: tf('time.q'), a: tf('time.a') } : { q: tf('timeService.q'), a: tf('timeService.a') },
    hasSelf && !isService ? { q: tf('edit.q'), a: tf('edit.a') } : { q: tf('editService.q'), a: tf('editService.a') },
    ...(p.tiers.some((x) => x.features.some((f) => f.soon)) ? [{ q: tf('soon.q'), a: tf('soon.a') }] : []),
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  const tierCta = (tier: ProductTier) => {
    if (tier.fulfilment === 'self') {
      // A self tier sells a real template: send them to its preview page.
      return { path: tier.selfTemplate ? `/t/${tier.selfTemplate}` : primaryPath, wa: null, label: t('tierCtaSelf') };
    }
    return { path: null, wa: whatsappHref(waBase, whatsappMessage(p, locale, tier)), label: t('tierCtaService') };
  };

  const others = PRODUCTS.filter((o) => o.slug !== p.slug).slice(0, 4);

  return (
    <>
      <ProductView product={p.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* ── hero ── */}
      <section className="relative isolate overflow-hidden bg-[#150C11] pb-16 pt-24 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(70% 55% at 50% 0%, rgb(var(--c-brand-500) / 0.38), transparent 70%),' +
              'radial-gradient(45% 45% at 90% 85%, rgb(var(--c-gold-500) / 0.22), transparent 70%)',
          }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-token-8 px-token-4 md:grid-cols-[1fr_auto] md:gap-16">
          <div className="min-w-0 text-center md:text-start">
            <nav className="text-sm text-white/50">
              <Link href="/products" className="hover:text-white">
                {t('allProducts')}
              </Link>
            </nav>
            <span className="mt-token-4 inline-flex max-w-full items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-token-3 py-token-1 text-sm text-white/85">
              <span aria-hidden>{p.emoji}</span>
              <span className="truncate">{L(p.season)}</span>
            </span>
            <p className="mt-token-4 font-heading text-base font-semibold text-gold">{L(p.name)}</p>
            <h1 className="mt-token-2 font-heading text-[clamp(1.9rem,6vw,3.5rem)] font-extrabold leading-[1.15] tracking-tight">
              {L(p.headline)}
            </h1>
            <p className="mx-auto mt-token-4 max-w-prose text-lg leading-relaxed text-white/75 md:mx-0">{L(p.subheadline)}</p>
            <p className="mt-token-4">
              <span className="inline-flex items-center rounded-pill bg-gold px-token-4 py-token-2 font-heading text-lg font-bold text-neutral-900">
                {priceBadge}
              </span>
            </p>
            <div className="mt-token-6 flex flex-col items-stretch gap-token-3 sm:flex-row sm:items-center md:justify-start">
              <Cta product={p.slug} cta="hero" path={primaryPath} wa={waGeneral} className={BTN_PRIMARY}>
                {isService ? <WhatsAppIcon className="h-5 w-5" /> : null}
                {isService && !waGeneral ? t('contactFallback') : L(p.primaryLabel)}
              </Cta>
              {!isService && waGeneral ? (
                <ProductCtaAnchor href={waGeneral} product={p.slug} cta="hero_whatsapp" className={cn(BTN_WA, 'text-white')}>
                  <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                  {t('whatsappSecondary')}
                </ProductCtaAnchor>
              ) : null}
            </div>
          </div>

          <div className="md:w-[280px]">
            {demo ? (
              <InvitationPreview experience={demo} label={t('demoLabel')} />
            ) : (
              <RsvpMock locale={locale} label={t('mockHint')} />
            )}
            <p className="mt-token-3 text-center text-xs text-white/50">{demo ? t('demoHint') : t('mockHint')}</p>
          </div>
        </div>
      </section>

      {/* ── benefits ── */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-token-4">
          <h2 className="text-center font-heading text-2xl font-bold text-ink md:text-3xl">{t('benefitsTitle')}</h2>
          <ul className="mt-token-8 grid gap-token-4 md:grid-cols-3">
            {p.bullets.map((b, i) => (
              <li key={i} className="flex gap-token-3 rounded-xl border border-border bg-surface p-token-4">
                <span aria-hidden className="mt-0.5 text-success">✓</span>
                <span className="text-ink">{L(b)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── how it works ── */}
      <section className="bg-surface py-14">
        <div className="mx-auto max-w-5xl px-token-4">
          <h2 className="text-center font-heading text-2xl font-bold text-ink md:text-3xl">{t('howTitle')}</h2>
          <ol className="mt-token-8 grid gap-token-6 md:grid-cols-3">
            {p.steps.map((s, i) => (
              <li key={i} className="flex gap-token-3 md:flex-col">
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-heading text-lg font-bold text-white"
                >
                  {formatEgp(i + 1, locale)}
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading text-lg font-semibold text-ink">{L(s.title)}</h3>
                  <p className="mt-token-1 text-muted">{L(s.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── who it's for ── */}
      <section className="py-14">
        <div className="mx-auto max-w-3xl px-token-4 text-center">
          <h2 className="font-heading text-2xl font-bold text-ink md:text-3xl">{t('audienceTitle')}</h2>
          <ul className="mt-token-6 flex flex-wrap justify-center gap-token-2">
            {p.audience.map((a, i) => (
              <li key={i} className="rounded-pill border border-border bg-surface px-token-4 py-token-2 text-sm text-ink">
                {L(a)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── pricing ── */}
      <section id="pricing" className="scroll-mt-20 bg-surface py-14">
        <div className="mx-auto max-w-5xl px-token-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-bold text-ink md:text-3xl">{t('pricingTitle')}</h2>
            <p className="mt-token-3 text-muted">{t('pricingSubtitle')}</p>
          </div>
          <div
            className={cn(
              'mx-auto mt-token-8 grid gap-token-6',
              p.tiers.length >= 3 ? 'md:grid-cols-3' : 'max-w-3xl md:grid-cols-2',
            )}
          >
            {p.tiers.map((tier, i) => {
              const c = tierCta(tier);
              return (
                <div
                  key={i}
                  className={cn(
                    'relative flex flex-col rounded-xl border bg-surface-2 p-token-6',
                    tier.featured ? 'border-brand ring-2 ring-brand/30' : 'border-border',
                  )}
                >
                  {tier.featured ? (
                    <span className="absolute -top-3 end-token-6 rounded-pill bg-brand px-token-3 py-token-1 text-xs font-semibold text-white">
                      {t('featured')}
                    </span>
                  ) : null}
                  <p className="text-xs font-semibold text-gold">{tier.fulfilment === 'self' ? t('self') : t('service')}</p>
                  <h3 className="mt-token-1 font-heading text-lg font-semibold text-ink">{L(tier.name)}</h3>
                  <p className="mt-token-3 font-heading text-3xl font-extrabold text-ink">{price(tier.price)}</p>
                  {tier.unit ? <p className="text-sm text-muted">{L(tier.unit)}</p> : null}
                  <ul className="mb-token-6 mt-token-4 flex flex-col gap-token-2 text-sm">
                    {tier.features.map((f, j) => (
                      <li key={j} className={cn('flex items-start gap-token-2', f.soon ? 'text-muted' : 'text-ink')}>
                        <span aria-hidden className={f.soon ? 'mt-0.5 text-muted' : 'mt-0.5 text-success'}>
                          {f.soon ? '○' : '✓'}
                        </span>
                        <span>
                          {L(f.text)}
                          {f.soon ? (
                            <span className="ms-token-2 inline-block rounded-pill bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
                              {t('soon')}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Cta
                    product={p.slug}
                    cta={`tier_${i}`}
                    path={c.path}
                    wa={c.wa}
                    className={cn('mt-auto w-full', tier.fulfilment === 'self' ? BTN_PRIMARY : cn(BTN_WA, 'text-ink'))}
                  >
                    {tier.fulfilment !== 'self' ? <WhatsAppIcon className="h-5 w-5 text-[#25D366]" /> : null}
                    {tier.fulfilment !== 'self' && !c.wa ? t('contactFallback') : c.label}
                  </Cta>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14">
        <div className="mx-auto max-w-3xl px-token-4">
          <h2 className="text-center font-heading text-2xl font-bold text-ink md:text-3xl">{t('faqTitle')}</h2>
          <div className="mt-token-8 flex flex-col gap-token-3">
            {faq.map((f, i) => (
              <details key={i} className="group rounded-xl border border-border bg-surface p-token-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-token-3 font-heading text-base font-semibold text-ink">
                  {f.q}
                  <span aria-hidden className="text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-token-3 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── other products ── */}
      <section className="bg-surface py-14">
        <div className="mx-auto max-w-5xl px-token-4">
          <h2 className="text-center font-heading text-xl font-bold text-ink">{t('otherProducts')}</h2>
          <ul className="mt-token-6 grid grid-cols-2 gap-token-3 md:grid-cols-4">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/products/${o.slug}`}
                  className="flex h-full flex-col gap-token-1 rounded-xl border border-border bg-surface-2 p-token-4 text-ink transition-colors hover:border-brand"
                >
                  <span aria-hidden className="text-2xl">{o.emoji}</span>
                  <span className="font-heading text-sm font-semibold">{L(o.name)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── sticky CTA bar. It sits over the footer's generic floating WhatsApp
          pill on purpose: on a product page the chat should name the product. ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 px-token-4 py-token-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl items-center gap-token-3">
          <Cta product={p.slug} cta="sticky" path={primaryPath} wa={waGeneral} className={cn(PRIMARY_BASE, 'min-w-0 flex-1 px-token-4 text-sm')}>
            <span className="truncate">{isService && !waGeneral ? t('contactFallback') : L(p.primaryLabel)}</span>
          </Cta>
          {waGeneral ? (
            <ProductCtaAnchor
              href={waGeneral}
              product={p.slug}
              cta="sticky_whatsapp"
              aria-label={isService ? t('whatsappPrimary') : t('whatsappSecondary')}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-token-2 rounded-pill bg-[#25D366] px-token-4 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              <span className="hidden sm:inline">{isService ? t('whatsappPrimary') : t('whatsappSecondary')}</span>
            </ProductCtaAnchor>
          ) : null}
        </div>
      </div>
    </>
  );
}
