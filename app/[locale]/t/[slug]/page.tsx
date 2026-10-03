import { cache } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { getGalleryTemplate, listGalleryTemplates } from '@/server/public/templates-gallery';
import { closestSlug } from '@/lib/closest-slug';
import { buildPreviewExperience } from '@/lib/template-preview';
import { formatPrice } from '@/components/marketing/gallery-cards';
import { TemplatePreview } from '@/components/templates/TemplatePreview';

/**
 * Public, no-account preview of a template — the full animated card exactly
 * as a guest sees it, with a fixed "make this card" bar. Before this, tapping a
 * design in the gallery went straight to /login, which visitors from Messenger
 * read as "the link doesn't open".
 */
const load = cache(getGalleryTemplate);

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await load(slug);
  if (!t) return { title: 'Congrats' };
  const title = (locale === 'ar' ? t.titleAr : t.titleEn) ?? t.titleEn ?? 'Congrats';
  return {
    title,
    openGraph: { title, type: 'website', images: [{ url: `/${locale}/og`, width: 1200, height: 630 }] },
  };
}

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const tpl = await load(slug);
  if (!tpl) {
    // A typo in a shared link opens the design it meant; otherwise the gallery.
    const match = closestSlug(slug, (await listGalleryTemplates()).map((t) => t.slug));
    redirect(match ? `/${locale}/t/${match}` : `/${locale}/templates`);
  }
  const l = locale === 'ar' ? 'ar' : 'en';
  const tg = await getTranslations({ locale, namespace: 'marketing.templates' });
  // The guest's sample name follows the DESIGN's language, not the page's.
  const tgDesign = await getTranslations({ locale: tpl.locale, namespace: 'marketing.templates' });
  const session = await getSession();

  const builderPath = `/builder?template=${tpl.id}`;
  // Anonymous visitors sign up first and land straight in the builder.
  const ctaHref = session ? builderPath : `/login?mode=signup&next=${encodeURIComponent(builderPath)}`;

  return (
    <TemplatePreview
      experience={buildPreviewExperience(tpl.definition, {
        templateId: tpl.id,
        category: tpl.categorySlug ?? undefined,
        recipientName: tgDesign('sampleName'),
      })}
      slug={tpl.slug}
      ctaHref={ctaHref}
      priceLabel={tpl.isPaid ? formatPrice(tpl.pricePiastres, l) : tg('free')}
      locale={l}
    />
  );
}
