'use client';

import * as React from 'react';
import { Player } from '@/components/player';
import { PhoneFrame } from './PhoneFrame';
import { buildDemoExperience } from './demo-experience';

/**
 * Landing-page mini Player. Renders the real shared Player inside a phone frame.
 * The Player is full-viewport (h-[100dvh]) by design, so we host it in an
 * absolutely-positioned layer constrained to the phone screen.
 */
export function HeroDemo({
  locale,
  recipientName,
  autoStart = true,
}: {
  locale: 'ar' | 'en';
  recipientName: string;
  autoStart?: boolean;
}) {
  const experience = React.useMemo(
    () => buildDemoExperience(locale, recipientName),
    [locale, recipientName],
  );

  return (
    <PhoneFrame>
      {/* Constrain the full-bleed Player to the phone screen box. */}
      <div className="absolute inset-0">
        <div className="h-full w-full [&>div]:!h-full">
          <Player experience={experience} startPaused={!autoStart} />
        </div>
      </div>
    </PhoneFrame>
  );
}
