'use client';

import * as React from 'react';
import { Link } from '@/i18n/navigation';
import { Player } from '@/components/player/Player';
import type { BoundExperience } from '@/lib/template-contract';
import { track } from '@/lib/track';
import { WhatsAppCtaLink } from '@/components/marketing/WhatsAppButton';

/** The full player plus a fixed call to action, for the public template preview. */
export function TemplatePreview({
  experience,
  slug,
  ctaHref,
  priceLabel,
  locale,
  whatsapp,
  names,
  nameKind,
}: {
  experience: BoundExperience;
  slug: string;
  ctaHref: string;
  priceLabel: string;
  locale: 'ar' | 'en';
  /** Done-for-you fallback on WhatsApp; null when no support number is set. */
  whatsapp?: { href: string; message: string; cta: string; label: string } | null;
  /** The visitor's own names (`?names=`); the card is then watermarked. */
  names?: string | null;
  nameKind: 'couple' | 'recipient';
}) {
  const ar = locale === 'ar';
  const [editing, setEditing] = React.useState(false);
  React.useEffect(() => {
    track('template_view', { template: slug, preview: true, names: Boolean(names) });
  }, [slug, names]);

  return (
    <>
      {/* Remount on new names so the card replays its opening with them. */}
      <Player key={names ?? ''} experience={experience} />
      {names ? <Watermark /> : null}
      <NamesBar
        ar={ar}
        names={names ?? null}
        nameKind={nameKind}
        editing={editing || !names}
        onEdit={() => setEditing(true)}
      />
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
        {whatsapp ? (
          <WhatsAppCtaLink
            href={whatsapp.href}
            message={whatsapp.message}
            label={whatsapp.cta}
            ariaLabel={whatsapp.label}
            source="template_preview"
            className="h-9 shrink-0 rounded-pill border border-white/20 bg-white/10 px-token-3 text-sm text-white hover:bg-white/20 [&>span]:sr-only sm:[&>span]:not-sr-only"
          />
        ) : null}
      </div>
    </>
  );
}

/**
 * "PREVIEW" tiled across the whole screen, over the card and under the bars.
 * A card with the visitor's names is free to look at, not free to send: this
 * is what keeps a screen recording of it from doing the job of the real link.
 */
function Watermark() {
  const tile = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="180">` +
      `<text x="130" y="95" text-anchor="middle" transform="rotate(-28 130 90)" ` +
      `font-family="sans-serif" font-size="30" font-weight="700" fill="white" fill-opacity=".22" ` +
      `stroke="black" stroke-opacity=".18" stroke-width="1">معاينة · PREVIEW</text></svg>`,
  );
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40"
      style={{ backgroundImage: `url("data:image/svg+xml,${tile}")` }}
    />
  );
}

/**
 * Under the top bar: type your names and see the card with them. The Messenger
 * auto-reply can't put the names in the link itself, so the page asks.
 */
function NamesBar({
  ar,
  names,
  nameKind,
  editing,
  onEdit,
}: {
  ar: boolean;
  names: string | null;
  nameKind: 'couple' | 'recipient';
  editing: boolean;
  onEdit: () => void;
}) {
  const placeholder =
    nameKind === 'couple'
      ? ar ? 'اسم العريس والعروسة… مثلاً: علا وعمرو' : 'Your names… e.g. Ola & Amr'
      : ar ? 'اكتب الاسم' : 'Type the name';
  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      className="fixed inset-x-0 top-[52px] z-50 flex justify-center px-token-3 pt-token-2"
    >
      {editing ? (
        <form
          method="get"
          className="flex w-full max-w-md items-center gap-token-2 rounded-pill border border-white/15 bg-black/75 p-1 backdrop-blur-md"
        >
          <input
            name="names"
            defaultValue={names ?? ''}
            maxLength={44}
            required
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent px-token-3 py-token-1 text-sm text-white placeholder:text-white/50 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-pill bg-white px-token-3 py-token-1 text-sm font-semibold text-neutral-900"
          >
            {ar ? 'شوف دعوتك 👀' : 'See it 👀'}
          </button>
        </form>
      ) : (
        <div className="flex max-w-md items-center gap-token-2 rounded-pill border border-white/15 bg-black/75 px-token-3 py-token-1 text-xs text-white/90 backdrop-blur-md">
          <span>
            {ar
              ? 'دي معاينة بأساميكم ✨ الميعاد والقاعة وصوركم بتتحط بعد الدفع'
              : 'A preview with your names ✨ date, venue and photos go in once you pay'}
          </span>
          <button type="button" onClick={onEdit} className="shrink-0 font-semibold underline">
            {ar ? 'غيّر' : 'Edit'}
          </button>
        </div>
      )}
    </div>
  );
}
