'use client';

import * as React from 'react';
import { Link } from '@/i18n/navigation';
import { Player } from '@/components/player/Player';
import type { BoundExperience } from '@/lib/template-contract';
import { track } from '@/lib/track';

/** The full player plus a fixed call to action, for the public template preview. */
export function TemplatePreview({
  experience,
  slug,
  ctaHref,
  priceLabel,
  locale,
}: {
  experience: BoundExperience;
  slug: string;
  ctaHref: string;
  priceLabel: string;
  locale: 'ar' | 'en';
}) {
  const ar = locale === 'ar';
  React.useEffect(() => {
    track('template_view', { template: slug, preview: true });
  }, [slug]);

  return (
    <>
      <Player experience={experience} />
      {/* Top, not bottom: the bottom corner belongs to the card's music button. */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center gap-token-2 border-b border-white/10 bg-black/80 px-token-4 py-token-2 backdrop-blur-md">
        <Link
          href="/templates"
          className="shrink-0 rounded-pill px-token-3 py-token-2 text-sm text-white/80 hover:text-white"
        >
          {ar ? '→ التصميمات' : '← Designs'}
        </Link>
        <a
          href={`/${locale}${ctaHref}`}
          className="flex-1 rounded-pill bg-brand px-token-4 py-token-2 text-center text-sm font-semibold text-white shadow-lg"
        >
          {ar ? `اعمل الكارت ده · ${priceLabel}` : `Make this card · ${priceLabel}`}
        </a>
      </div>
    </>
  );
}
