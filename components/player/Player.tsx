'use client';

/**
 * Shared experience Player. Renders ANY BoundExperience generically:
 *  - autoplay with per-scene holdMs + tap-to-advance
 *  - mobile-first full-screen, direction-aware (rtl/ltr)
 *  - respects prefers-reduced-motion
 *  - confetti on the Finale scene (handled inside SceneRenderer)
 *
 * Consumers (the /p/[slug] route) pass a validated BoundExperience.
 */
import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  sceneForStep,
  type BoundExperience,
  type SceneDef,
} from '@/lib/template-contract';
import { SceneRenderer } from './SceneRenderer';

export interface PlayerProps {
  experience: BoundExperience;
  /** Start paused until first tap (recommended for mobile autoplay policies). */
  startPaused?: boolean;
  onComplete?: () => void;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return reduced;
}

export function Player({ experience, startPaused = true, onComplete }: PlayerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const steps = React.useMemo(
    () => [...experience.steps].sort((a, b) => a.orderIndex - b.orderIndex),
    [experience.steps],
  );

  const [index, setIndex] = React.useState(0);
  const [started, setStarted] = React.useState(!startPaused);

  const current = steps[index];
  const scene: SceneDef | undefined = current
    ? sceneForStep(experience, current)
    : undefined;

  const advance = React.useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) {
        onComplete?.();
        return i;
      }
      return i + 1;
    });
  }, [steps.length, onComplete]);

  // Autoplay timer based on per-scene holdMs.
  React.useEffect(() => {
    if (!started || !scene) return;
    const hold = (current?.animationConfig?.holdMs as number) ?? scene.holdMs ?? 4000;
    const id = setTimeout(advance, hold);
    return () => clearTimeout(id);
  }, [started, scene, current, advance]);

  const atEnd = index >= steps.length - 1;

  const handleTap = () => {
    if (!started) {
      setStarted(true);
      return;
    }
    if (atEnd) {
      setIndex(0); // replay
      return;
    }
    advance();
  };

  const theme = experience.theme ?? {};
  const bg =
    theme.palette && theme.palette.length >= 2
      ? `linear-gradient(160deg, ${theme.palette[1]}, ${theme.palette[0]})`
      : 'linear-gradient(160deg, rgb(var(--c-brand-700)), rgb(var(--c-brand-500)))';

  return (
    <div
      dir={experience.direction}
      role="button"
      tabIndex={0}
      aria-label="experience player"
      onClick={handleTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleTap();
      }}
      className="relative flex h-[100dvh] w-full select-none items-center justify-center overflow-hidden"
      style={{ background: bg }}
      data-testid="player-root"
    >
      {/* progress dots */}
      <div className="absolute inset-inline-0 top-token-4 z-10 flex justify-center gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className="h-1 w-6 rounded-pill transition-opacity"
            style={{ background: 'white', opacity: i <= index ? 0.95 : 0.3 }}
          />
        ))}
      </div>

      <div className="h-full w-full">
        <AnimatePresence mode="wait">
          {started && scene && current ? (
            <div key={current.templateStepId + index} className="h-full w-full">
              <SceneRenderer
                scene={scene}
                step={current}
                direction={experience.direction}
                recipientName={experience.recipientName}
                reducedMotion={reducedMotion}
                active
              />
            </div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* start / replay overlay */}
      {!started ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/20 text-center">
          <div className="rounded-pill bg-white/90 px-token-6 py-token-3 font-medium text-ink shadow-[var(--shadow-pop)]">
            ▶
          </div>
        </div>
      ) : null}

      {atEnd && started ? (
        <div className="absolute inset-inline-0 bottom-token-8 z-10 flex justify-center">
          <span className="rounded-pill bg-white/15 px-token-4 py-token-2 text-sm text-white backdrop-blur">
            ↻
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default Player;
