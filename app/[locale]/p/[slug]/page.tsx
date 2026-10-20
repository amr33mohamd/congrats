import { cache } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Player } from '@/components/player';
// Use B1's share-service which enforces the SAME unlock gate as the F0 stub but
// additionally binds `media` rows to short-lived signed URLs so recipient photos
// render. The gate (link active + not disabled + not expired + isUnlocked) means
// paid+unapproved experiences still return null and render the neutral page.
import { getPublicExperienceBySlug } from '@/server/dashboard/share-service';
import { headers } from 'next/headers';
import { cardPreview, previewVersion } from '@/lib/card-preview';

// generateMetadata and the page both need the experience. Without request-level
// dedupe every open ran the full load twice — and bumped the view counter twice.
// Link-preview crawlers (WhatsApp, Facebook, Telegram…) fetch the page to
// read its tags; that is not someone opening the card, so it is not a view.
const PREVIEW_BOT = /WhatsApp|facebookexternalhit|Facebot|TelegramBot|Twitterbot|Slackbot|Discordbot|LinkedInBot|Googlebot|bingbot|SkypeUriPreview|Applebot|redditbot|Pinterest/i;

const loadPublicExperience = cache(async (slug: string) => {
  const ua = (await headers()).get('user-agent') ?? '';
  return getPublicExperienceBySlug(slug, { countView: !PREVIEW_BOT.test(ua) });
});

// Public player route. F0 owns this: it enforces the unlock gate SERVER-SIDE
// and renders the shared Player. Recipients are unauthenticated.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  // Cards are private-by-link: keep them (and dead links) out of search indexes.
  const robots = { index: false, follow: false };
  const exp = await loadPublicExperience(slug);
  if (!exp) return { title: 'Congrats', robots };
  // Title, description and picture come from the card itself (names, line,
  // date, photo), so a pasted link shows whose card it is.
  const preview = cardPreview(exp);
  const title = preview.title;
  const description = preview.description;
  const image = `/${locale}/p/${slug}/og?v=${previewVersion(preview)}`;
  const alt = [preview.kicker, preview.headline].filter(Boolean).join(' — ');
  return {
    title: { absolute: title },
    description,
    robots,
    // A page-level openGraph replaces the layout's, so the image is re-stated.
    openGraph: {
      title,
      description,
      type: 'website',
      locale: preview.locale === 'ar' ? 'ar_EG' : 'en_GB',
      images: [{ url: image, width: 1200, height: 630, alt, type: 'image/jpeg' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const experience = await loadPublicExperience(slug);

  if (!experience) {
    const t = await getTranslations('common');
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-token-3 bg-surface-2 p-token-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-ink">{t('player.unavailableTitle')}</h1>
        <p className="text-muted">{t('player.unavailableBody')}</p>
      </main>
    );
  }

  return <Player experience={experience} startPaused />;
}
