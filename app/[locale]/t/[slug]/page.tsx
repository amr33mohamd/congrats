import { cache } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { getGalleryTemplate, listGalleryTemplates } from '@/server/public/templates-gallery';
import { closestSlug } from '@/lib/closest-slug';
import { cardPreview } from '@/lib/card-preview';
import { formatPrice } from '@/components/marketing/gallery-cards';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { SITE_URL, supportWhatsappHref } from '@/lib/site';
import { namedPreview, namesParam } from './named';

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
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ names?: string | string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await load(slug);
  if (!t) return { title: 'Congrats' };
  const names = namesParam((await searchParams).names);
  if (names) {
    // The link card in Messenger shows their names, not the design's name.
    const title = cardPreview(namedPreview(t, names, '').experience).title;
    const description =
      locale === 'en' ? 'Your names on the invitation 👀 open it' : 'دعوتكم بأساميكم 👀 افتحها وشوفها بتتفتح قدامك';
    const image = `/${locale}/t/${slug}/og?names=${encodeURIComponent(names)}`;
    return {
      title,
      description,
      openGraph: { title, description, type: 'website', images: [{ url: image, width: 1200, height: 630 }] },
    };
  }
  const title = (locale === 'ar' ? t.titleAr : t.titleEn) ?? t.titleEn ?? 'Congrats';
  return {
    title,
    openGraph: { title, type: 'website', images: [{ url: `/${locale}/og`, width: 1200, height: 630 }] },
  };
}

export default async function TemplatePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ names?: string | string[] }>;
}) {
  const { locale, slug } = await params;
  const names = namesParam((await searchParams).names);
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

  // "Or we make it for you": the chat opens with this design already named.
  const waHref = supportWhatsappHref();
  const title = (l === 'ar' ? tpl.titleAr : tpl.titleEn) ?? tpl.titleEn ?? tpl.slug;
  const whatsapp = waHref
    ? {
        href: waHref,
        message: tg('whatsappMessage', { title, url: `${SITE_URL}/${l}/t/${tpl.slug}` }),
        cta: tg('whatsappCta'),
        label: tg('whatsappLabel'),
      }
    : null;

  const { experience, hasCouple } = namedPreview(tpl, names, tgDesign('sampleName'));

  return (
    <TemplatePreview
      experience={experience}
      names={names}
      nameKind={hasCouple ? 'couple' : 'recipient'}
      slug={tpl.slug}
      ctaHref={ctaHref}
      priceLabel={tpl.isPaid ? formatPrice(tpl.pricePiastres, l) : tg('free')}
      locale={l}
      whatsapp={whatsapp}
    />
  );
}
