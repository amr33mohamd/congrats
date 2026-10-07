import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { ProductLanding } from '@/components/products/ProductLanding';
import { PRODUCTS, productBySlug } from '@/content/products';
import { listGalleryTemplates } from '@/server/public/templates-gallery';
import { buildPreviewExperience } from '@/lib/template-preview';
import type { BoundExperience } from '@/lib/template-contract';
import { closestSlug } from '@/lib/closest-slug';
import { marketingMetadata, site, supportWhatsappHref } from '@/lib/site';

/**
 * Product landing page: /[locale]/products/<slug>. One component renders every
 * product from content/products.ts. (Not /p/… — that is the share-link player.)
 *
 * Per request, like the occasion pages: the header reflects the session and
 * the live demo reads the published catalog.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = productBySlug(slug);
  if (!p) return {};
  const l = locale === 'ar' ? 'ar' : 'en';
  const base = marketingMetadata({
    locale: l,
    path: `/products/${p.slug}`,
    title: p.seo.title[l],
    description: p.seo.description[l],
  });
  return { ...base, title: { absolute: `${p.seo.title[l]} · Congrats` } };
}

/**
 * The product's demo template bound with sample copy. Decorative: if the DB is
 * down or the template is unpublished, the page falls back to its static mock.
 */
async function loadDemo(slug: string | undefined, category: string | undefined): Promise<BoundExperience | null> {
  if (!slug) return null;
  try {
    const row = (await listGalleryTemplates()).find((r) => r.slug === slug);
    if (!row) return null;
    // Sample guest name in the DESIGN's language, like the /t/ preview page.
    const t = await getTranslations({ locale: row.locale, namespace: 'marketing.templates' });
    return buildPreviewExperience(row.definition, {
      templateId: row.id,
      category: row.categorySlug ?? category,
      recipientName: t('sampleName'),
    });
  } catch (err) {
    console.warn('[products] demo unavailable', err);
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = productBySlug(slug);
  if (!product) {
    const match = closestSlug(slug, PRODUCTS.map((p) => p.slug));
    redirect(match ? `/${locale}/products/${match}` : `/${locale}/products`);
  }
  setRequestLocale(locale);
  const l = (locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en';

  const category = product.primary.kind === 'category' ? product.primary.slug : undefined;
  const [session, demo] = await Promise.all([getSession(), loadDemo(product.demoTemplate, category)]);

  return (
    <div className="min-h-[100dvh] bg-surface-2">
      <SiteHeader isAuthed={Boolean(session)} overDark />
      <main>
        <ProductLanding
          product={product}
          locale={l}
          demo={demo}
          waBase={supportWhatsappHref()}
          reviewWindow={site.reviewWindow[l]}
        />
      </main>
      <SiteFooter />
      {/* room for the fixed CTA bar so it never covers the footer's last line */}
      <div aria-hidden className="h-24" />
    </div>
  );
}
