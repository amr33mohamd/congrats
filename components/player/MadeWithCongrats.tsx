'use client';

/**
 * The quiet line at the very end of a shared card: "made with Congrats —
 * make one for your own occasion". Every card is seen by dozens of guests,
 * and each of them is planning an occasion of their own; this is how they
 * find us. Only on the public card page, never in previews.
 */
import { track } from '@/lib/track';

export function MadeWithCongrats({ locale }: { locale: string }) {
  const ar = locale === 'ar';
  const href = `/${ar ? 'ar' : 'en'}?utm_source=card&utm_medium=referral&utm_campaign=made-with`;
  return (
    <div className="flex justify-center px-token-4 pb-token-12 pt-token-6">
      <a
        href={href}
        target="_blank"
        rel="noopener"
        onClick={(e) => {
          e.stopPropagation();
          track('card_cta');
        }}
        className="inline-flex items-center gap-token-2 rounded-full bg-black/45 px-token-4 py-token-2 text-sm text-white backdrop-blur-md transition hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        <span aria-hidden>🎉</span>
        {ar ? 'اتعمل بـ Congrats · اعمل كارت لمناسبتك' : 'Made with Congrats · make one for your occasion'}
      </a>
    </div>
  );
}
