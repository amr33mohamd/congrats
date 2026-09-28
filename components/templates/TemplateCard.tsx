'use client';

import * as React from 'react';
import { Link } from '@/i18n/navigation';
import { Spinner } from '@/components/ui';
import type { BoundExperience } from '@/lib/template-contract';
import { TemplateStage } from './TemplateStage';

export interface TemplateCardData {
  slug: string;
  title: string;
  /** Occasion slug, used by the gallery filter. */
  categorySlug: string;
  /** Localized occasion name, shown as a chip. */
  categoryLabel: string;
  locale: 'ar' | 'en';
  isPaid: boolean;
  /** Preformatted price, or the localized word for free. */
  priceLabel: string;
  popular: boolean;
  experience: BoundExperience;
}

/**
 * A gallery tile that previews the real template.
 *
 * Idle it paints the cover scene as a settled frame. On hover or keyboard focus
 * it walks the template's own scenes on a timer, so you watch the actual card
 * play rather than a marketing still — and the caption rises over it.
 *
 * Scene cycling only runs while engaged: a grid of these costs one static
 * render each until you point at one.
 */
export function TemplateCard({
  data,
  popularLabel,
  href = '/builder',
  onSelect,
  busy = false,
}: {
  data: TemplateCardData;
  popularLabel: string;
  /** Where the card navigates. Ignored when `onSelect` is given. */
  href?: string;
  /** Use the card as a button instead — the builder picker creates on click. */
  onSelect?: () => void;
  busy?: boolean;
}) {
  const [engaged, setEngaged] = React.useState(false);
  const [sceneIndex, setSceneIndex] = React.useState(0);
  const sceneCount = data.experience.steps.length;

  React.useEffect(() => {
    if (!engaged || sceneCount < 2) return;
    const id = setInterval(() => setSceneIndex((i) => (i + 1) % sceneCount), 1900);
    return () => clearInterval(id);
  }, [engaged, sceneCount]);

  // Always fall back to the cover when the pointer leaves, so the grid settles
  // into a consistent set of covers instead of wherever each card stopped.
  const disengage = () => {
    setEngaged(false);
    setSceneIndex(0);
  };

  const shell =
    'group relative block aspect-[9/16] w-full overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/10 transition-all duration-[var(--motion-base)] ease-emphasized hover:-translate-y-1 hover:ring-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none';

  const engageProps = {
    onMouseEnter: () => setEngaged(true),
    onMouseLeave: disengage,
    onFocus: () => setEngaged(true),
    onBlur: disengage,
  };

  const body = (
    <>
      <TemplateStage experience={data.experience} sceneIndex={sceneIndex} animate={engaged} />

      {/* price + popularity, pinned to the end edge so RTL mirrors correctly */}
      <div className="pointer-events-none absolute top-2 inset-inline-end-2 z-20 flex flex-row-reverse gap-1">
        <span
          className={`rounded-pill px-2 py-1 text-[11px] font-semibold leading-4 backdrop-blur-md ${
            data.isPaid ? 'bg-brand/90 text-white' : 'bg-white/85 text-ink'
          }`}
        >
          {data.priceLabel}
        </span>
        {data.popular ? (
          <span className="rounded-pill bg-[#7C3AED]/90 px-2 py-1 text-[11px] font-semibold leading-4 text-white backdrop-blur-md">
            {popularLabel}
          </span>
        ) : null}
      </div>

      {/* caption — hidden until the card is engaged */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-2 p-3 opacity-0 transition-all duration-[var(--motion-base)] ease-emphasized group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.55) 55%, transparent)' }}
      >
        <p className="font-heading text-sm font-semibold text-white drop-shadow">{data.title}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium leading-4 text-white/90">
            {data.categoryLabel}
          </span>
          <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium uppercase leading-4 text-white/90">
            {data.locale}
          </span>
        </div>
      </div>

      {busy ? (
        <span className="absolute inset-0 z-30 grid place-items-center bg-black/55 backdrop-blur-[1px]">
          <Spinner size={26} />
        </span>
      ) : null}
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        data-testid="template-card"
        aria-label={data.title}
        disabled={busy}
        onClick={onSelect}
        {...engageProps}
        className={shell}
      >
        {body}
      </button>
    );
  }

  return (
    <Link href={href} data-testid="template-card" aria-label={data.title} {...engageProps} className={shell}>
      {body}
    </Link>
  );
}
