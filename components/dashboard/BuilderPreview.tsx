'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Player } from '@/components/player';
import { trackUrl, TRACK_VOLUME } from '@/lib/audio';
import { PhoneFrame } from '@/components/marketing/PhoneFrame';
import type { BoundExperience } from '@/lib/template-contract';
import type { EditorExperience } from './types';
import type { LocalStep } from './editor-state';
import { toBoundExperience } from './editor-state';

/**
 * Live phone preview that renders the real Player from the builder's in-memory
 * editor state. We remount the Player when content changes (keyed by a content
 * hash) so the user sees their edits replay immediately.
 *
 * The music plays HERE, not inside the Player: the Player remounts on every
 * edit, which restarted the song with each keystroke, and its own control
 * only appears once the card is opened. This audio element survives the
 * remounts, and the switch under the phone stops or starts it (remembered on
 * this device).
 */
const EDITOR_MUSIC_KEY = 'congrats:editor-music-off';
export function BuilderPreview({
  experience,
  steps,
  recipientName,
  fields,
  focusStepId,
}: {
  experience: EditorExperience;
  steps: LocalStep[];
  recipientName: string;
  /** Live card-level field values (couple names, wedding date…). */
  fields?: Record<string, string>;
  /** When set, preview starts at this scene so editing jumps straight to it. */
  focusStepId?: string | null;
}) {
  const bound: BoundExperience = React.useMemo(
    () => toBoundExperience(experience, steps, recipientName, fields ?? experience.fields ?? {}),
    [experience, steps, recipientName, fields],
  );

  // Remount when textual content changes so edits are reflected on replay.
  const contentKey = React.useMemo(
    () =>
      JSON.stringify({
        r: recipientName,
        fl: fields,
        f: focusStepId,
        s: steps.map((s) => [s.templateStepId, s.text, s.media.map((m) => m.url)]),
      }),
    [steps, recipientName, fields, focusStepId],
  );

  return (
    <div>
      <PhoneFrame>
        <div className="absolute inset-0">
          <div className="h-full w-full [&>div]:!h-full">
            <Player
              key={contentKey}
              experience={bound}
              startPaused={false}
              startAtStepId={focusStepId}
              embedded
              soundtrack={false}
            />
          </div>
        </div>
      </PhoneFrame>
      <PreviewMusic src={experience.musicUrl || trackUrl(experience.theme?.music)} />
    </div>
  );
}

function PreviewMusic({ src }: { src: string | null }) {
  const t = useTranslations('dashboard.wizard.content');
  const ref = React.useRef<HTMLAudioElement>(null);
  const [off, setOff] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    try {
      setOff(window.localStorage.getItem(EDITOR_MUSIC_KEY) === '1');
    } catch {
      /* blocked storage: music on */
    }
  }, []);
  React.useEffect(() => setFailed(false), [src]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || failed) return;
    if (off) {
      el.pause();
      return;
    }
    el.volume = TRACK_VOLUME;
    // May be refused before the page has had a tap; the button then starts it.
    const p = el.play() as Promise<void> | undefined;
    p?.catch?.(() => setPlaying(false));
  }, [src, off, failed]);

  if (!src || failed) return null;

  const toggle = () => {
    const el = ref.current;
    // Playing → stop. Not playing (switched off, or refused autoplay) → play.
    const turnOff = playing;
    setOff(turnOff);
    try {
      window.localStorage.setItem(EDITOR_MUSIC_KEY, turnOff ? '1' : '0');
    } catch {
      /* non-fatal */
    }
    if (el) {
      if (turnOff) {
        el.pause();
      } else {
        el.volume = TRACK_VOLUME;
        // Inside the click, so the browser counts it as the user's gesture.
        el.play().catch(() => setPlaying(false));
      }
    }
  };

  return (
    <div className="mt-token-3 flex justify-center">
      <audio
        ref={ref}
        src={src}
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        className="inline-flex items-center gap-token-2 rounded-pill border border-border bg-surface px-token-4 py-token-2 text-sm font-medium text-ink transition-colors hover:border-brand"
      >
        <span aria-hidden>{playing ? '⏸' : '▶'}</span>
        {playing ? t('musicStop') : t('musicPlay')}
      </button>
    </div>
  );
}
