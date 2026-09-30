'use client';

import * as React from 'react';
import {
  sceneForStep,
  type Background,
  type BoundExperience,
  type Decoration,
  type SceneDef,
} from '@/lib/template-contract';
import { bodyFamily, googleFontsHref } from '@/lib/fonts';
import { SceneRenderer } from '@/components/player/SceneRenderer';
import { SceneBackground, backgroundCss } from '@/components/player/SceneBackground';
import { Decorations } from '@/components/player/Decorations';
import { SceneOrnament } from '@/components/player/SceneOrnament';

/**
 * One scene of a BoundExperience, chrome-free and sized to its container.
 *
 * The Player itself is `h-[100dvh]` and carries progress dots, a start overlay
 * and a replay affordance — all wrong for a thumbnail. This renders the same
 * three layers (background, ornament, scene) at whatever size the parent gives
 * it, which is what makes a gallery card an honest preview of the real card.
 *
 * `animate: false` drives everything through the reduced-motion path, so an
 * idle card paints a settled frame and starts no timers or confetti loops —
 * the difference between a grid of 16 static covers and 16 running players.
 */

/** Virtual phone the preview is composed at, 9:16 to match the card. */
const STAGE_W = 390;
const STAGE_H = 693;

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

/**
 * Scale factor to fit the virtual phone into the card.
 *
 * This has to be measured: CSS can derive a length from `100cqw` but not the
 * unitless number `scale()` needs (dividing a length by a length is invalid in
 * calc), so there is no pure-CSS way to express "shrink 390px to my width".
 */
function useFitScale(ref: React.RefObject<HTMLDivElement | null>): number {
  const [scale, setScale] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / STAGE_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return scale;
}

export function TemplateStage({
  experience,
  sceneIndex = 0,
  animate = false,
  className,
}: {
  experience: BoundExperience;
  sceneIndex?: number;
  /** Play transitions and ambient effects. Off for idle thumbnails. */
  animate?: boolean;
  className?: string;
}) {
  const outer = React.useRef<HTMLDivElement>(null);
  const scale = useFitScale(outer);
  const { theme } = experience;
  const palette = theme.palette ?? [];

  const step = experience.steps[sceneIndex % experience.steps.length];
  const scene = step ? sceneForStep(experience, step) : undefined;

  const fontHref = React.useMemo(() => {
    const families = new Set<string | undefined>([theme.fontHeading, theme.fontBody]);
    for (const s of experience.scenes) if (s.style?.headingFont) families.add(s.style.headingFont);
    return googleFontsHref(Array.from(families));
  }, [theme.fontHeading, theme.fontBody, experience.scenes]);

  if (!scene || !step) return null;

  const bg = backgroundFor(scene, theme);
  const deco = decorationFor(scene, theme);
  const reduced = !animate;

  return (
    <div
      ref={outer}
      // Visual preview only: the card's own title/labels carry the meaning, so
      // keep the scaled-down scene text out of the a11y tree and outline.
      aria-hidden
      className={`relative h-full w-full overflow-hidden ${className ?? ''}`}
      style={{ background: backgroundCss(bg, palette) }}
    >
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}
      {/*
        Render at a real phone's dimensions, then scale the whole thing down to
        the card. Scene type is sized in cqw against THIS box, so a thumbnail
        gets exactly the proportions of the live card — shrinking the container
        instead would hit the clamp() floors and blow headings up until words
        broke mid-syllable ("Anniversar/y").
      */}
      <div
        dir={experience.direction}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${STAGE_W}px`,
          height: `${STAGE_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          // Hide the unscaled frame for the one paint before measurement lands.
          visibility: scale ? 'visible' : 'hidden',
          background: backgroundCss(bg, palette),
          fontFamily: bodyFamily(theme.fontBody),
          containerType: 'inline-size',
        }}
      >
        <SceneBackground background={bg} palette={palette} reducedMotion={reduced} active />
        <SceneOrnament ornament={scene.ornament ?? theme.ornament} accent={theme.accent} direction={experience.direction} />
        <Decorations
          decoration={deco}
          direction={experience.direction}
          reducedMotion={reduced}
          active={animate}
        />
        <SceneRenderer
          key={scene.id}
          scene={scene}
          step={step}
          theme={theme}
          direction={experience.direction}
          recipientName={experience.recipientName}
          fields={experience.fields}
          reducedMotion={reduced}
          active
        />
      </div>
    </div>
  );
}
