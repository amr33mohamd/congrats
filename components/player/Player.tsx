'use client';

/**
 * Shared experience Player. Renders ANY BoundExperience generically:
 *  - autoplay with per-scene holdMs + tap-to-advance
 *  - mobile-first full-screen, direction-aware (rtl/ltr)
 *  - per-scene backgrounds (gradient / image / pattern) + ambient decorations
 *  - on-demand web fonts for the template's display typefaces
 *  - respects prefers-reduced-motion
 *
 * Consumers (the /p/[slug] route, the builder preview) pass a BoundExperience.
 */
import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  sceneForStep,
  type Background,
  type BoundExperience,
  type Decoration,
  type SceneDef,
} from '@/lib/template-contract';
import { googleFontsHref } from '@/lib/fonts';
import { SceneRenderer } from './SceneRenderer';
import { SceneBackground, backgroundCss } from './SceneBackground';
import { Decorations } from './Decorations';

export interface PlayerProps {
  experience: BoundExperience;
  /** Start paused until first tap (recommended for mobile autoplay policies). */
  startPaused?: boolean;
  /** Begin on the step with this templateStepId (used by the builder preview). */
  startAtStepId?: string | null;
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

/** Resolve the decoration for a scene: explicit → theme default → Finale gets confetti. */
function decorationFor(scene: SceneDef, theme: BoundExperience['theme']): Decoration | undefined {
  if (scene.decoration && scene.decoration.effect !== 'none') return scene.decoration;
  if (scene.decoration?.effect === 'none') return undefined;
  if (theme.decoration && theme.decoration.effect !== 'none') return theme.decoration;
  if (scene.type === 'Finale') return { effect: 'confetti', intensity: 'high' };
  return undefined;
}

function backgroundFor(scene: SceneDef, theme: BoundExperience['theme']): Background | undefined {
  return scene.background ?? theme.background;
}

export function Player({ experience, startPaused = true, startAtStepId, onComplete }: PlayerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const steps = React.useMemo(
    () => [...experience.steps].sort((a, b) => a.orderIndex - b.orderIndex),
    [experience.steps],
  );

  const initialIndex = React.useMemo(() => {
    if (!startAtStepId) return 0;
    const i = steps.findIndex((s) => s.templateStepId === startAtStepId);
    return i >= 0 ? i : 0;
  }, [startAtStepId, steps]);
  const [index, setIndex] = React.useState(initialIndex);
  const [started, setStarted] = React.useState(!startPaused);

  const current = steps[index];
  const scene: SceneDef | undefined = current ? sceneForStep(experience, current) : undefined;
  const theme = experience.theme ?? { palette: [] };
  const palette = theme.palette ?? [];

  const advance = React.useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) {
        onComplete?.();
        return i;
      }
      return i + 1;
    });
  }, [steps.length, onComplete]);

  React.useEffect(() => {
    if (!started || !scene) return;
    const hold = (current?.animationConfig?.holdMs as number) ?? scene.holdMs ?? 4000;
    const id = setTimeout(advance, hold);
    return () => clearTimeout(id);
  }, [started, scene, current, advance]);

  const atEnd = index >= steps.length - 1;

  const handleTap = () => {
    if (!started) return setStarted(true);
    if (atEnd) return setIndex(0);
    advance();
  };

  // Font families used anywhere in this experience → one Google Fonts request.
  const fontHref = React.useMemo(() => {
    const families = new Set<string | undefined>([theme.fontHeading, theme.fontBody]);
    for (const s of experience.scenes) if (s.style?.headingFont) families.add(s.style.headingFont);
    return googleFontsHref(Array.from(families));
  }, [theme.fontHeading, theme.fontBody, experience.scenes]);

  // Base background (fallback shown behind the per-scene layer + during transitions).
  const baseBg = backgroundCss(scene ? backgroundFor(scene, theme) : undefined, palette);

  const sceneBg = scene ? backgroundFor(scene, theme) : undefined;
  const sceneDeco = scene ? decorationFor(scene, theme) : undefined;

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
      style={{
        background: baseBg,
        fontFamily: 'var(--font-body), system-ui, sans-serif',
        // Establish a query container so headings size to the player width
        // (works in both the full-screen player and the builder phone preview).
        containerType: 'inline-size',
      }}
      data-testid="player-root"
    >
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}

      {/* progress dots */}
      <div className="absolute inset-inline-0 top-token-4 z-20 flex justify-center gap-1.5 px-token-6">
        {steps.map((_, i) => (
          <span
            key={i}
            className="h-1 flex-1 max-w-8 rounded-pill transition-opacity"
            style={{ background: 'white', opacity: i <= index ? 0.95 : 0.3 }}
          />
        ))}
      </div>

      <div className="h-full w-full">
        <AnimatePresence mode="wait">
          {started && scene && current ? (
            <div key={current.templateStepId + index} className="absolute inset-0 h-full w-full">
              <SceneBackground background={sceneBg} palette={palette} reducedMotion={reducedMotion} active />
              <Decorations decoration={sceneDeco} direction={experience.direction} reducedMotion={reducedMotion} active />
              <SceneRenderer
                scene={scene}
                step={current}
                theme={theme}
                direction={experience.direction}
                recipientName={experience.recipientName}
                reducedMotion={reducedMotion}
                active
              />
            </div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* start overlay */}
      {!started ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/25 text-center backdrop-blur-[2px]">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-2xl text-ink shadow-[var(--shadow-pop)]">
            ▶
          </div>
        </div>
      ) : null}

      {atEnd && started ? (
        <div className="absolute inset-inline-0 bottom-token-8 z-20 flex justify-center">
          <span className="rounded-pill bg-white/15 px-token-4 py-token-2 text-sm text-white backdrop-blur">↻</span>
        </div>
      ) : null}
    </div>
  );
}

export default Player;
