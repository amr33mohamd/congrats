'use client';

/**
 * Shared experience Player. Renders ANY BoundExperience generically as ONE
 * continuously scrolling card rather than a deck of tap-through slides:
 *  - every scene is a stacked section, revealed as it scrolls into view
 *  - a centred portrait column, so a phone-shaped card reads the same on desktop
 *  - per-scene backgrounds (gradient / image / pattern), ornament and ambient
 *    decorations, layered behind that scene's own content
 *  - on-demand web fonts for the template's display typefaces
 *  - respects prefers-reduced-motion
 *
 * Why scrolling and not slides: an invitation is a document. A reader wants to
 * go back and re-read the venue or the date, which a timed auto-advancing deck
 * actively fights — and ambient effects only need to run for the section you
 * are actually looking at. Deliberately NO scroll-snap: free scrolling lets a
 * long section (a ceremony block, a gallery) be read at its own pace.
 *
 * Consumers (the /p/[slug] route, the builder preview) pass a BoundExperience.
 */
import * as React from 'react';
import { motion, useInView } from 'framer-motion';
import {
  applyTokens,
  sceneForStep,
  type Background,
  type BoundExperience,
  type BoundStep,
  type Decoration,
  type SceneDef,
} from '@/lib/template-contract';
import { cssFamily, googleFontsHref } from '@/lib/fonts';
import { SceneRenderer, hexLuminance, readableOn } from './SceneRenderer';
import { SceneBackground, backgroundCss } from './SceneBackground';
import { Decorations } from './Decorations';
import { SceneOrnament } from './SceneOrnament';
import { Soundtrack } from './Soundtrack';

export interface PlayerProps {
  experience: BoundExperience;
  /** Gate behind a tap before opening (also what legitimises audio playback). */
  startPaused?: boolean;
  /** Scroll to the section for this step id (used by the builder preview). */
  startAtStepId?: string | null;
  /** Fired once the last section has been reached. */
  onComplete?: () => void;
  /**
   * Render inside a fixed-size box (the builder's phone frame) instead of the
   * page. Sections then size to the CONTAINER rather than the window — `88svh`
   * inside a 500px phone mock would otherwise make every section taller than
   * the frame it sits in.
   */
  embedded?: boolean;
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

function isEmptyPhotoScene(scene: SceneDef, step: BoundStep): boolean {
  if (scene.type !== 'PhotoReveal' && scene.type !== 'Gallery') return false;
  if (scene.background?.type === 'image') return false;
  return step.media.length === 0;
}

/* ──────────────────────────── one scene section ─────────────────────────── */

function SceneSection({
  scene,
  step,
  experience,
  reducedMotion,
  onEnter,
  isLast,
  onComplete,
}: {
  scene: SceneDef;
  step: BoundStep;
  experience: BoundExperience;
  reducedMotion: boolean;
  onEnter: () => void;
  isLast: boolean;
  onComplete?: () => void;
}) {
  const ref = React.useRef<HTMLElement>(null);
  // A low threshold: content should be there as soon as the section edges in,
  // not withheld until it dominates the screen.
  const inView = useInView(ref, { amount: 0.15 });
  // Sticky. `inView` alone drove SceneRenderer's `active`, so a scene's text
  // sat at its `hidden` variant (opacity 0) until the threshold hit — and went
  // blank again as soon as you scrolled past. Once revealed, stay revealed;
  // only the ambient effects follow `inView`, so they stop costing anything
  // off-screen.
  const [revealed, setRevealed] = React.useState(false);
  React.useEffect(() => {
    if (inView) setRevealed(true);
  }, [inView]);
  const { theme } = experience;
  const palette = theme.palette ?? [];
  const bg = backgroundFor(scene, theme);
  const deco = decorationFor(scene, theme);
  const orn = scene.ornament ?? theme.ornament;
  // Only a scene carrying its OWN artwork paints anything; one that just
  // inherits the theme background contributes nothing and stays on the surface.
  const hasOwnArt = Boolean(scene.background && scene.background.type === 'image');
  const tall = scene.type === 'Cover' || scene.type === 'Finale' || hasOwnArt;

  React.useEffect(() => {
    if (!inView) return;
    onEnter();
    if (isLast) onComplete?.();
  }, [inView, isLast, onEnter, onComplete]);

  return (
    <section
      ref={ref}
      id={`scene-${step.templateStepId}`}
      data-scene={step.templateStepId}
      className={`relative flex w-full items-center ${tall ? '' : 'py-token-8'}`}
      style={{
        // Only the opening and closing scenes claim a full screen. Holding a
        // four-line venue block to 88% of the viewport left a screen of empty
        // ground between every fact and broke the one-continuous-card read.
        minHeight: tall ? 'var(--scene-min-h, 88svh)' : undefined,
        // NO background here. The card is one continuous surface painted once
        // on the root; giving each section its own ground drew a hard seam at
        // every boundary and the invitation read as a stack of separate slides.
        containerType: 'inline-size',
      }}
    >
      {/*
        A scene's own artwork (a photo) is an inset panel on that surface, not a
        new ground. The mask feathers its top and bottom edges so it dissolves
        into the card instead of butting against it.
      */}
      {hasOwnArt ? (
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden"
          style={{
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)',
          }}
        >
          <SceneBackground background={bg} palette={palette} reducedMotion={reducedMotion} active={inView} />
        </div>
      ) : null}
      {theme.art?.corner ? (
        // Painted art supersedes the vector ornament. One file serves both
        // corners: the second copy is rotated 180° for a balanced diagonal.
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={theme.art.corner} alt="" className="absolute -top-2 inset-inline-start-0 w-[46%] max-w-[260px]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={theme.art.corner} alt="" className="absolute -bottom-2 inset-inline-end-0 w-[46%] max-w-[260px] rotate-180" />
        </div>
      ) : (
        <SceneOrnament ornament={orn} accent={theme.accent} direction={experience.direction} />
      )}
      {/* Ambient effects run only for the section on screen. */}
      <Decorations
        decoration={deco}
        direction={experience.direction}
        reducedMotion={reducedMotion}
        active={inView}
      />

      {/*
        `self-stretch` matters: SceneRenderer's Frame is `h-full`, which only
        resolves against a definite height. As a centred flex child this box
        would size to its content and Frame would collapse to zero.
      */}
      <motion.div
        className="relative z-[1] w-full self-stretch py-token-8"
        initial={reducedMotion ? false : { opacity: 0, y: 28 }}
        animate={revealed ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <SceneRenderer
          scene={scene}
          step={step}
          theme={theme}
          direction={experience.direction}
          recipientName={experience.recipientName}
          reducedMotion={reducedMotion}
          active={revealed}
        />
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────── the player ─────────────────────────────── */

export function Player({
  experience,
  startPaused = true,
  startAtStepId,
  onComplete,
  embedded = false,
}: PlayerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const steps = React.useMemo(
    () => [...experience.steps].sort((a, b) => a.orderIndex - b.orderIndex),
    [experience.steps],
  );
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [started, setStarted] = React.useState(!startPaused);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const theme = experience.theme ?? { palette: [] };
  const palette = theme.palette ?? [];

  const fontHref = React.useMemo(() => {
    const families = new Set<string | undefined>([theme.fontHeading, theme.fontBody]);
    for (const s of experience.scenes) if (s.style?.headingFont) families.add(s.style.headingFont);
    return googleFontsHref(Array.from(families));
  }, [theme.fontHeading, theme.fontBody, experience.scenes]);

  // The builder jumps the preview to whichever scene is being edited.
  React.useEffect(() => {
    if (!started || !startAtStepId) return;
    const el = rootRef.current?.querySelector(`[data-scene="${startAtStepId}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }, [started, startAtStepId, reducedMotion]);

  const baseBg = backgroundCss(theme.background, palette);

  // Gate styling comes from the template, never from app tokens.
  const ground = palette[0] ?? '#151015';
  const paper = [...palette].sort((a, b) => hexLuminance(b) - hexLuminance(a))[0] ?? '#F7F2E8';
  const accent = theme.accent ?? palette[3] ?? '#D9B778';
  const gateInk = readableOn(paper, palette);
  const gateOrnament = theme.ornament?.kind && theme.ornament.kind !== 'none'
    ? theme.ornament.kind
    : 'corners';
  // The cover's heading is the couple; `recipientName` is the guest being invited.
  const coverStep = steps[0];
  const coupleNames = coverStep
    ? applyTokens(coverStep.text?.heading ?? '', experience.recipientName)
    : '';

  return (
    <div
      ref={rootRef}
      dir={experience.direction}
      className={
        embedded
          ? 'relative h-full w-full overflow-y-auto'
          : 'relative min-h-[100dvh] w-full'
      }
      style={{
        background: baseBg,
        fontFamily: 'var(--font-body), system-ui, sans-serif',
        ['--scene-min-h' as string]: embedded ? '100%' : '88svh',
      }}
      data-testid="player-root"
    >
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}

      {/*
        The one continuous surface. Fixed rather than repeated per section so a
        long card is a single unbroken ground the whole way down — the seams
        between sections disappear and it reads as one invitation.
      */}
      <div
        aria-hidden
        className={embedded ? 'pointer-events-none absolute inset-0' : 'pointer-events-none fixed inset-0'}
        style={{
          background: baseBg,
          // A painted paper/texture, when the style has one, sits over the base
          // colour and repeats — it is the whole card's single ground.
          ...(theme.art?.texture
            ? { backgroundImage: `url(${theme.art.texture})`, backgroundSize: '512px', backgroundBlendMode: 'soft-light' }
            : {}),
        }}
      >
        <SceneBackground
          background={theme.background}
          palette={palette}
          reducedMotion={reducedMotion}
          active
        />
      </div>

      {/*
        The card column. A wedding invitation is a portrait object; letting it
        span a 27" monitor would strand the type in the middle of nowhere, so it
        is capped and centred with the theme background showing either side.
      */}
      <div className="mx-auto w-full max-w-[620px]">
        {steps.map((step, i) => {
          const scene = sceneForStep(experience, step);
          if (!scene) return null;
          // A photo section with no photo is a caption floating over nothing.
          // Leave it out until the sender uploads one — never pad a real
          // invitation with stock photography of strangers.
          if (isEmptyPhotoScene(scene, step)) return null;
          return (
            <SceneSection
              key={step.templateStepId}
              scene={scene}
              step={step}
              experience={experience}
              reducedMotion={reducedMotion}
              isLast={i === steps.length - 1}
              onComplete={onComplete}
              onEnter={() => setActiveIndex(i)}
            />
          );
        })}
      </div>

      {/* Reading position — replaces the old slide dots. */}
      <div
        aria-hidden
        className={`pointer-events-none ${embedded ? 'sticky' : 'fixed'} inset-inline-start-0 top-0 z-20 h-1 bg-white/80 transition-[width] duration-300`}
        style={{ width: `${((activeIndex + 1) / Math.max(steps.length, 1)) * 100}%` }}
      />

      <Soundtrack
        music={theme.music}
        started={started}
        label={experience.locale === 'ar' ? 'الموسيقى' : 'Music'}
      />

      {/*
        The open gate. Not decoration: browsers refuse unmuted audio without a
        user gesture, so this tap is what lets the soundtrack play. Styled from
        the TEMPLATE's own palette rather than app tokens — the previous version
        used `text-ink` on white, which turned into white-on-white the moment
        the product theme went dark.
      */}
      {!started ? (
        <div
          className={`${embedded ? 'absolute' : 'fixed'} inset-0 z-30 flex items-center justify-center px-token-4`}
          style={{ background: `${ground}E6` }}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl px-token-6 py-token-8 text-center"
            style={{
              background: paper,
              boxShadow: `0 0 0 1px ${accent}66, 0 24px 70px -20px rgba(0,0,0,0.75)`,
            }}
          >
            <SceneOrnament
              ornament={{ kind: gateOrnament, color: accent, opacity: 0.5, scale: 1 }}
              accent={accent}
              direction={experience.direction}
            />

            <div className="relative">
              {/* medallion */}
              <span
                className="mx-auto mb-token-4 grid h-12 w-12 place-items-center rounded-full text-lg"
                style={{ background: accent, color: paper }}
                aria-hidden
              >
                ♥
              </span>

              {coupleNames ? (
                <p
                  className="font-heading text-3xl font-semibold leading-tight"
                  style={{ color: gateInk, fontFamily: cssFamily(theme.fontHeading) }}
                >
                  {coupleNames}
                </p>
              ) : null}

              {/* divider */}
              <span
                aria-hidden
                className="mx-auto my-token-4 block h-px w-24"
                style={{ background: accent, opacity: 0.6 }}
              />

              <p className="text-sm" style={{ color: gateInk, opacity: 0.75 }}>
                {experience.locale === 'ar' ? 'يدعوكم لمشاركة الفرحة' : 'Cordially invites'}
              </p>

              {experience.recipientName ? (
                <span
                  className="mt-token-3 inline-block rounded-pill px-token-4 py-token-2 font-heading text-lg font-semibold"
                  style={{ background: `${accent}2E`, color: gateInk }}
                >
                  {experience.recipientName}
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => setStarted(true)}
                className="mt-token-8 block w-full rounded-pill px-token-8 py-token-4 text-base font-semibold shadow-[var(--shadow-pop)] transition-transform duration-[var(--motion-base)] ease-emphasized hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ background: accent, color: readableOn(accent, palette), outlineColor: accent }}
              >
                {experience.locale === 'ar' ? 'افتح الدعوة' : 'Open'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
