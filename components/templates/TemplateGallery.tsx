'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { TemplateCard, type TemplateCardData } from './TemplateCard';

export interface GalleryFilter {
  slug: string;
  label: string;
}

/**
 * The gallery grid plus its occasion filter.
 *
 * Filtering is client-side over a list that is at most a few dozen templates —
 * cheap, and it keeps the whole page a single server render with no refetch per
 * chip. Cards that scroll out stay mounted but idle (see TemplateCard), so the
 * cost of a filter change is a re-render, not a re-fetch.
 */
export function TemplateGallery({
  cards,
  filters,
}: {
  cards: TemplateCardData[];
  filters: GalleryFilter[];
}) {
  const t = useTranslations('marketing.templates');
  const [active, setActive] = React.useState<string>('all');

  const shown = React.useMemo(
    () => (active === 'all' ? cards : cards.filter((c) => c.categorySlug === active)),
    [cards, active],
  );

  const chip = (key: string, label: string) => {
    const on = active === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setActive(key)}
        aria-pressed={on}
        className={`rounded-pill px-token-4 py-token-2 text-sm font-medium transition-colors duration-[var(--motion-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          on
            ? 'bg-brand text-white'
            : 'bg-white/8 text-white/70 hover:bg-white/15 hover:text-white'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <div className="mt-token-8 flex flex-wrap justify-center gap-token-2">
        {chip('all', t('all'))}
        {filters.map((f) => chip(f.slug, f.label))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-token-8 text-center text-white/55">{t('empty')}</p>
      ) : (
        <div className="mt-token-8 grid grid-cols-2 gap-token-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((card) => (
            <TemplateCard key={card.slug} data={card} popularLabel={t('popular')} />
          ))}
        </div>
      )}
    </>
  );
}
