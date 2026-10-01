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
 * A template whose track has not shipped (none do yet — see lib/audio.ts)
 * renders nothing at all: no <audio>, so no request and no 404 in the
 * console, and no control that does nothing. If a listed file still fails to
 * load, the control hides itself.
 */
export function Soundtrack({
  music,
  started,
  label,
  className,
  style,
}: {
  music?: string | null;
  started: boolean;
  /** Accessible name for the toggle, localized by the caller. */
  label: string;
  /** Positioning for the control (the Player pins it to its own corner). */
  className?: string;
  style?: React.CSSProperties;
}) {
  const src = trackUrl(music);
  const ref = React.useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => setMuted(readMutePreference()), []);
  React.useEffect(() => setFailed(false), [src]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !started || failed) return;
    el.volume = TRACK_VOLUME;
    if (muted) {
      el.pause();
      return;
    }
    // Still possible to be blocked (no gesture reached us, e.g. an automated
    // run). A rejected play is "not playing yet", not an error: the control
    // stays so the viewer can start it by hand, which IS a gesture.
    // Older engines return nothing from play() rather than a promise.
    const playing = el.play() as Promise<void> | undefined;
    playing?.catch?.(() => setMuted(true));
  }, [src, started, muted, failed]);

  if (!src || failed) return null;

  const toggle = () => {
    const next = !muted;
    writeMutePreference(next);
    setMuted(next);
    // Start inside the click itself: a play() deferred to an effect can lose
    // the user-gesture token on Safari and be refused again.
    const el = ref.current;
    if (el && !next) {
      el.volume = TRACK_VOLUME;
      el.play().catch(() => setMuted(true));
    }
  };

  return (
    <>
      <audio
        ref={ref}
        src={src}
        loop
        // Nothing downloads until the card is opened.
        preload={started ? 'auto' : 'none'}
        onError={() => setFailed(true)}
      />
      {started ? (
        <button
          type="button"
          onClick={(e) => {
            // Never let the music control double as a tap on the card.
            e.stopPropagation();
            toggle();
          }}
          aria-label={label}
          aria-pressed={!muted}
          className={`z-30 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-base text-white backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${className ?? 'absolute bottom-token-4 end-token-4'}`}
          style={style}
        >
          <span aria-hidden>{muted ? '🔇' : '🔊'}</span>
        </button>
      ) : null}
    </>
  );
}
