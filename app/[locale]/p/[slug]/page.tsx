import { cache } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Player } from '@/components/player';
// Use B1's share-service which enforces the SAME unlock gate as the F0 stub but
// additionally binds `media` rows to short-lived signed URLs so recipient photos
// render. The gate (link active + not disabled + not expired + isUnlocked) means
// paid+unapproved experiences still return null and render the neutral page.
import { getPublicExperienceBySlug } from '@/server/dashboard/share-service';

// generateMetadata and the page both need the experience. Without request-level
// dedupe every open ran the full load twice — and bumped the view counter twice.
const loadPublicExperience = cache(getPublicExperienceBySlug);

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
  const t = await getTranslations({ locale, namespace: 'common' });
  const title = exp.recipientName
    ? t('player.metaFor', { name: exp.recipientName })
    : t('player.metaGeneric');
  return {
    title,
    robots,
    openGraph: { title, type: 'website' },
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
