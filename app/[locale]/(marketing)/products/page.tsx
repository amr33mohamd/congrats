import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { Link } from '@/i18n/navigation';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { formatEgp } from '@/components/products/ProductLanding';
import { PRODUCTS, startingPrice } from '@/content/products';
import { marketingMetadata } from '@/lib/site';

/** Index of the product landing pages: /[locale]/products. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = locale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations({ locale: l, namespace: 'products.index' });
  const base = marketingMetadata({ locale: l, path: '/products', title: t('title'), description: t('description') });
  return { ...base, title: { absolute: t('title') } };
}

export default async function ProductsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = (locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en';
  const [t, tp, session] = await Promise.all([
    getTranslations('products.index'),
    getTranslations('products.page'),
    getSession(),
  ]);

  const priceLabel = (n: number | null) =>
    n == null ? tp('quote') : n === 0 ? tp('free') : tp('from', { price: tp('egp', { n: formatEgp(n, l) }) });

  return (
    <div className="min-h-[100dvh] bg-surface-2">
      <SiteHeader isAuthed={Boolean(session)} overDark />
      <main>
        <section className="relative isolate overflow-hidden bg-[#150C11] pb-14 pt-28 text-center text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(70% 60% at 50% 0%, rgb(var(--c-brand-500) / 0.38), transparent 70%),' +
                'radial-gradient(40% 50% at 10% 90%, rgb(var(--c-gold-500) / 0.18), transparent 70%)',
            }}
          />
          <div className="mx-auto max-w-2xl px-token-4">
            <span className="inline-flex rounded-pill border border-white/20 bg-white/10 px-token-3 py-token-1 text-sm text-white/85">
              {t('eyebrow')}
            </span>
            <h1 className="mt-token-4 font-heading text-[clamp(2rem,6vw,3.25rem)] font-extrabold leading-tight">{t('h1')}</h1>
            <p className="mt-token-4 text-lg text-white/75">{t('intro')}</p>
          </div>
        </section>

        <section className="py-14">
          <ul className="mx-auto grid max-w-6xl gap-token-4 px-token-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/products/${p.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-border bg-surface p-token-6 transition-colors hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <span aria-hidden className="text-4xl">{p.emoji}</span>
                  <h2 className="mt-token-3 font-heading text-lg font-bold text-ink">{p.name[l]}</h2>
                  <p className="mt-token-2 text-sm text-muted">{p.headline[l]}</p>
                  <p className="mt-token-1 text-xs text-muted/80">{p.season[l]}</p>
                  <div className="mt-auto flex items-center justify-between gap-token-2 pt-token-4">
                    <span className="rounded-pill bg-gold/15 px-token-3 py-token-1 text-sm font-bold text-gold">
                      {priceLabel(startingPrice(p))}
                    </span>
                    <span className="text-sm font-semibold text-brand group-hover:underline">{t('more')}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
