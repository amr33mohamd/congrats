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
 * Why scrolling and not slides: a card is a document. A reader wants to go
 * back and re-read the venue or the letter, which a timed auto-advancing deck
 * actively fights — and ambient effects only need to run for the section you
 * are actually looking at. Deliberately NO scroll-snap: free scrolling lets a
 * long section (a letter, a gallery) be read at its own pace.
 *
 * Consumers (the /p/[slug] route, the builder preview) pass a BoundExperience.
 */
import * as React from 'react';
import { motion, useInView } from 'framer-motion';
import {
  applyTokens,
  slotValue,
  sceneForStep,
  type Background,
  type BoundExperience,
  type BoundStep,
  type Decoration,
  type SceneDef,
} from '@/lib/template-contract';
import { bodyFamily, cssFamily, googleFontsHref } from '@/lib/fonts';
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
  /** Fired once, the first time the last section is reached. */
  onComplete?: () => void;
  /**
   * Render inside a fixed-size box (the builder's phone frame) instead of the
   * page. Sections then size to the CONTAINER rather than the window — `88svh`
   * inside a 500px phone mock would otherwise make every section taller than
   * the frame it sits in — and nothing is `position: fixed`, which would
   * escape the frame and pin itself to the browser window.
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

/* ─────────────────────────── which sections show ────────────────────────── */

const filled = (v: string | undefined) => (v ?? '').trim().length > 0;

/**
 * Should this section appear at all? A section with nothing in it is left out
 * rather than rendered as an empty band of padding:
 *  - a photo section with no photo is a caption floating over nothing — leave
 *    it out until the sender uploads one, and never pad a real card with stock
 *    photography of strangers;
 *  - a countdown with no (valid) date has nothing to count;
 *  - any section whose every field the sender cleared is how a sender removes
 *    an optional section (a party venue they don't need, say).
 */
export function isSectionVisible(
  scene: SceneDef,
  step: BoundStep,
  cardFields: Record<string, string> = {},
): boolean {
  const ownArt = scene.background?.type === 'image' && Boolean(scene.background.imageUrl);
  if (scene.type === 'PhotoReveal' || scene.type === 'Gallery') {
    return ownArt || step.media.length > 0;
  }
  // Values are read through slotValue: a slot bound to a card-level field (the
  // countdown's date is the wedding date) holds nothing on the step itself, and
  // reading step.text directly hid those sections as "empty".
  const value = (key: string) => slotValue(scene, step, key, cardFields);
  if (scene.type === 'Countdown') {
    const dateSlot = scene.slots.find((s) => s.type === 'date');
    if (dateSlot) {
      const raw = value(dateSlot.key);
      if (!filled(raw) || Number.isNaN(new Date(raw).getTime())) return false;
    }
  }
  const fields = scene.slots.filter((s) => s.type === 'text' || s.type === 'date');
  // A scene with no fillable fields is pure decoration; keep it.
  if (fields.length === 0) return true;
  if (ownArt || step.media.length > 0) return true;
  return fields.some((s) => filled(value(s.key)));
}

/**
 * An invitation is sent BY the hosts TO a guest; a greeting card is sent TO
 * the person being celebrated. The open gate words them differently, and the
 * RSVP / families sections are what only an invitation has.
 */
function isInvitation(experience: BoundExperience): boolean {
  return experience.scenes.some((s) => s.type === 'Rsvp' || s.type === 'Families');
}

/** `#abc` / `#aabbcc` + alpha → `#rrggbbaa`; anything else passes through. */
function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const hex = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${hex}${a}`;
}

/* ──────────────────────────── one scene section ─────────────────────────── */

function SceneSection({
  scene,
  step,
  experience,
  reducedMotion,
  onEnter,
}: {
  scene: SceneDef;
  step: BoundStep;
  experience: BoundExperience;
  reducedMotion: boolean;
  onEnter: (stepId: string) => void;
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
  // Latest callback without re-running the effect on every parent render (a
  // fresh closure each render used to re-fire it continuously while in view).
  const onEnterRef = React.useRef(onEnter);
  onEnterRef.current = onEnter;

  React.useEffect(() => {
    if (!inView) return;
    setRevealed(true);
    onEnterRef.current(step.templateStepId);
  }, [inView, step.templateStepId]);

  const { theme } = experience;
  const palette = theme.palette ?? [];
  const bg = backgroundFor(scene, theme);
  const deco = decorationFor(scene, theme);
  const orn = scene.ornament ?? theme.ornament;
  // Only a scene carrying its OWN artwork paints anything; one that just
  // inherits the theme background contributes nothing and stays on the surface.
  const hasOwnArt = Boolean(scene.background && scene.background.type === 'image');
  const tall = scene.type === 'Cover' || scene.type === 'Finale' || hasOwnArt;

  return (
    <section
      ref={ref}
      id={`scene-${step.templateStepId}`}
      data-scene={step.templateStepId}
      className={`relative flex w-full items-center overflow-hidden ${tall ? '' : 'py-token-4'}`}
      style={{
        // Only the opening and closing scenes claim a full screen. Holding a
        // four-line venue block to 88% of the viewport left a screen of empty
        // ground between every fact and broke the one-continuous-card read.
        minHeight: tall ? 'var(--scene-min-h, 88svh)' : undefined,
        // NO background here. The card is one continuous surface painted once
        // on the root; giving each section its own ground drew a hard seam at
        // every boundary and the card read as a stack of separate slides.
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
      {theme.art?.corner && orn && orn.kind !== 'none' ? (
        // Painted art supersedes the vector ornament. One file serves both
        // corners: the second copy is rotated 180° for a balanced diagonal.
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={theme.art.corner} alt="" className="absolute -top-2 start-0 w-[46%] max-w-[260px]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={theme.art.corner} alt="" className="absolute -bottom-2 end-0 w-[46%] max-w-[260px] rotate-180" />
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
          fields={experience.fields}
          reducedMotion={reducedMotion}
          active={revealed}
        />
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────── the open gate ──────────────────────────── */

/**
 * The open gate. Not decoration: browsers refuse unmuted audio without a user
 * gesture, so this tap is what lets the soundtrack play. Styled ONLY from the
 * template's own palette — an app token (`text-ink` on white) turned into
 * white-on-white the moment the product theme went dark — and every colour is
 * picked for contrast, so it reads on light and dark palettes alike.
 */
function OpenGate({
  experience,
  coverHeading,
  embedded,
  onOpen,
}: {
  experience: BoundExperience;
  coverHeading: string;
  embedded: boolean;
  onOpen: () => void;
}) {
  const { theme } = experience;
  const palette = theme.palette ?? [];
  const ar = experience.locale === 'ar';
  const invitation = isInvitation(experience);

  const hexes = palette.filter((c) => /^#[0-9a-f]{3,8}$/i.test(c));
  const byLight = [...hexes].sort((a, b) => hexLuminance(b) - hexLuminance(a));
  // The backdrop is the DARKEST entry, not palette[0]: on the light paper
  // styles palette[0] is the paper itself, and a cream card on a cream veil
  // had no edge at all.
  const ground = byLight[byLight.length - 1] ?? '#151015';
  const paper = byLight[0] ?? '#F7F2E8';
  const accent = theme.accent ?? palette[3] ?? '#D9B778';
  const ink = readableOn(paper, palette);
  const onAccent = readableOn(accent, palette);
  const ornamentKind = theme.ornament?.kind && theme.ornament.kind !== 'none' ? theme.ornament.kind : 'corners';
  const headingFont = cssFamily(theme.fontHeading);
  const recipient = experience.recipientName.trim();

  // An invitation leads with the hosts (the cover names the couple) and names
  // the guest below; a greeting leads with the person it is for.
  const title = invitation ? coverHeading : recipient || coverHeading;
  const lead = invitation
    ? ar
      ? 'يدعوكم لمشاركة الفرحة'
      : 'Cordially invites'
    : ar
      ? 'كارت معمول مخصوص عشانك'
      : 'A card made just for you';
  const cta = invitation ? (ar ? 'افتح الدعوة' : 'Open') : ar ? 'افتح الكارت' : 'Open your card';

  return (
    <div
      className={`${embedded ? 'absolute' : 'fixed'} inset-0 z-30 flex items-center justify-center px-token-4`}
      style={{ background: withAlpha(ground, 0.9) }}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl px-token-6 py-token-8 text-center"
        style={{
          background: paper,
          boxShadow: `0 0 0 1px ${withAlpha(accent, 0.4)}, 0 24px 70px -20px rgba(0,0,0,0.75)`,
        }}
      >
        <SceneOrnament
          ornament={{ kind: ornamentKind, color: accent, opacity: 0.5, scale: 1 }}
          accent={accent}
          direction={experience.direction}
        />

        <div className="relative">
          <span
            className="mx-auto mb-token-4 grid h-12 w-12 place-items-center rounded-full text-lg"
            style={{ background: accent, color: onAccent }}
            aria-hidden
          >
            {invitation ? '♥' : '✦'}
          </span>

          {title ? (
            <p
              className="text-3xl font-semibold leading-tight [overflow-wrap:anywhere]"
              style={{ color: ink, fontFamily: headingFont }}
            >
              {title}
            </p>
          ) : null}

          <span
            aria-hidden
            className="mx-auto my-token-4 block h-px w-24"
            style={{ background: accent, opacity: 0.6 }}
          />

          <p className="text-sm" style={{ color: ink, opacity: 0.75 }}>
            {lead}
          </p>

          {invitation && recipient ? (
            <span
              className="mt-token-3 inline-block rounded-pill px-token-4 py-token-2 text-lg font-semibold"
              style={{ background: withAlpha(accent, 0.18), color: ink, fontFamily: headingFont }}
            >
              {recipient}
            </span>
          ) : null}

          <button
            type="button"
            onClick={onOpen}
            className="mt-token-8 block w-full rounded-pill px-token-8 py-token-4 text-base font-semibold shadow-[var(--shadow-pop)] transition-transform duration-[var(--motion-base)] ease-emphasized hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: accent, color: onAccent, outlineColor: accent }}
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
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
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [started, setStarted] = React.useState(!startPaused);
  const [activeIndex, setActiveIndex] = React.useState(0);

  // The sections that actually render, in order. Computed once here so the
  // progress bar and "reached the end" agree with what the reader can see.
  const sections = React.useMemo(() => {
    const sorted = [...experience.steps].sort((a, b) => a.orderIndex - b.orderIndex);
    const out: Array<{ scene: SceneDef; step: BoundStep }> = [];
    for (const step of sorted) {
      const scene = sceneForStep(experience, step);
      if (scene && isSectionVisible(scene, step, experience.fields ?? {})) out.push({ scene, step });
    }
    return out;
  }, [experience]);

  const theme = experience.theme ?? { palette: [] };
  const palette = theme.palette ?? [];
  const accent = theme.accent ?? palette[3] ?? '#FFFFFF';

  const fontHref = React.useMemo(() => {
    const families = new Set<string | undefined>([theme.fontHeading, theme.fontBody]);
    for (const s of experience.scenes) if (s.style?.headingFont) families.add(s.style.headingFont);
    return googleFontsHref(Array.from(families));
  }, [theme.fontHeading, theme.fontBody, experience.scenes]);

  // The builder jumps the preview to whichever scene is being edited.
  React.useEffect(() => {
    if (!started || !startAtStepId) return;
    const root = rootRef.current;
    if (!root) return;
    const el = Array.from(root.querySelectorAll<HTMLElement>('[data-scene]')).find(
      (n) => n.dataset.scene === startAtStepId,
    );
    if (!el) return;
    const behavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth';
    if (embedded) {
      // Scroll the frame, not the page: scrollIntoView also scrolls every
      // scrollable ancestor, dragging the whole builder page along with it.
      const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
      root.scrollTo?.({ top, behavior });
    } else {
      el.scrollIntoView({ behavior, block: 'start' });
    }
  }, [started, startAtStepId, reducedMotion, embedded]);

  const completedRef = React.useRef(false);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;
  const lastId = sections[sections.length - 1]?.step.templateStepId;
  const handleEnter = React.useCallback(
    (stepId: string) => {
      const i = sections.findIndex((s) => s.step.templateStepId === stepId);
      if (i >= 0) setActiveIndex(i);
      if (stepId === lastId && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    },
    [sections, lastId],
  );

  const baseBg = backgroundCss(theme.background, palette);
  const cover = sections[0];
  // Through slotValue: on an invitation the cover heading is bound to the
  // card-level couple field, so the step itself holds no heading text.
  const coverHeading = cover
    ? applyTokens(
        slotValue(cover.scene, cover.step, 'heading', experience.fields ?? {}),
        experience.recipientName,
        experience.fields ?? {},
      )
    : '';
  const progress = ((activeIndex + 1) / Math.max(sections.length, 1)) * 100;

  return (
    <div
      ref={rootRef}
      dir={experience.direction}
      className={
        embedded
          ? 'relative h-full w-full overflow-y-auto overflow-x-clip'
          : 'relative min-h-[100dvh] w-full overflow-x-clip'
      }
      style={{
        background: baseBg,
        fontFamily: bodyFamily(theme.fontBody),
        // Embedded, the frame is a size container so a full-height section can
        // say "the frame's height" (`cqh`); a percentage min-height resolves
        // against the column's indefinite height and does nothing.
        ...(embedded ? { containerType: 'size' as const } : {}),
        ['--scene-min-h' as string]: embedded ? '100cqh' : '88svh',
      }}
      data-testid="player-root"
    >
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}

      {/*
        Reading position. First in the flow so `sticky top-0` holds it to the
        top of the frame while embedded; zero-height so it takes no layout.
        Drawn in the template's accent — a white bar vanished on light paper.
      */}
      <div
        aria-hidden
        className={`pointer-events-none ${embedded ? 'sticky' : 'fixed'} start-0 top-0 z-20 h-0 w-full`}
      >
        <div
          className="h-1 transition-[width] duration-300"
          style={{ width: `${progress}%`, background: accent, opacity: 0.85 }}
        />
      </div>

      {/*
        The one continuous surface. Fixed rather than repeated per section so a
        long card is a single unbroken ground the whole way down — the seams
        between sections disappear and it reads as one card. Embedded, it is
        absolute to the frame (fixed would pin it to the browser window).
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
        The card column. A card is a portrait object; letting it span a 27"
        monitor would strand the type in the middle of nowhere, so it is capped
        and centred with the theme background showing either side.
      */}
      <div className="relative mx-auto w-full max-w-[620px]">
        {sections.map(({ scene, step }) => (
          <SceneSection
            key={step.templateStepId}
            scene={scene}
            step={step}
            experience={experience}
            reducedMotion={reducedMotion}
            onEnter={handleEnter}
          />
        ))}
      </div>

      {/*
        The music control. Embedded it rides a zero-height sticky rail at the
        bottom of the frame; on the page it is fixed to the viewport corner.
      */}
      {embedded ? (
        <div className="pointer-events-none sticky bottom-0 z-30 h-0">
          <Soundtrack
            music={theme.music}
            started={started}
            label={experience.locale === 'ar' ? 'الموسيقى' : 'Music'}
            className="pointer-events-auto absolute bottom-token-4 end-token-4"
          />
        </div>
      ) : (
        <Soundtrack
          music={theme.music}
          started={started}
          label={experience.locale === 'ar' ? 'الموسيقى' : 'Music'}
          className="fixed bottom-token-4 end-token-4"
        />
      )}

      {!started ? (
        <OpenGate
          experience={experience}
          coverHeading={coverHeading}
          embedded={embedded}
          onOpen={() => setStarted(true)}
        />
      ) : null}
    </div>
  );
}
