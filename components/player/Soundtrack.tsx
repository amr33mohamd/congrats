'use client';

import * as React from 'react';
import {
  trackUrl,
  TRACK_VOLUME,
  readMutePreference,
  writeMutePreference,
} from '@/lib/audio';

/**
 * Looping background music for an experience, plus its mute control.
 *
 * Playback starts only once `started` is true — i.e. after the viewer has
 * tapped to open the card. That is not a stylistic choice: browsers refuse
 * unmuted autoplay without a user gesture, and the open tap is the gesture.
 *
 * A template whose track file is missing (none ship with the repo — see
 * lib/audio.ts) silently renders nothing rather than showing a dead control.
 */
export function Soundtrack({
  music,
  started,
  label,
}: {
  music?: string | null;
  started: boolean;
  /** Accessible name for the toggle, localized by the caller. */
  label: string;
}) {
  const src = trackUrl(music);
  const ref = React.useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = React.useState(true);
  const [available, setAvailable] = React.useState(false);

  React.useEffect(() => setMuted(readMutePreference()), []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !src || !started) return;
    el.volume = TRACK_VOLUME;
    if (muted) {
      el.pause();
      return;
    }
    // Still possible to be blocked (e.g. a Lighthouse run with no gesture);
    // treat a rejected play as "no music" rather than throwing.
    void el.play().catch(() => setAvailable(false));
  }, [src, started, muted]);

  if (!src) return null;

  const toggle = () => {
    setMuted((m) => {
      const next = !m;
      writeMutePreference(next);
      return next;
    });
  };

  return (
    <>
      <audio
        ref={ref}
        src={src}
        loop
        preload="none"
        onCanPlay={() => setAvailable(true)}
        onError={() => setAvailable(false)}
      />
      {available && started ? (
        <button
          type="button"
          onClick={(e) => {
            // The Player treats a tap anywhere as "advance"; the music control
            // must not double as a page turn.
            e.stopPropagation();
            toggle();
          }}
          aria-label={label}
          aria-pressed={!muted}
          className="absolute bottom-token-4 inset-inline-end-token-4 z-30 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-base text-white backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden>{muted ? '🔇' : '🔊'}</span>
        </button>
      ) : null}
    </>
  );
}
