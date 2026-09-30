'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  applyTokens,
  slotValue,
  type BoundStep,
  type BoundMedia,
  type SceneDef,
  type SceneStyle,
  type SceneType,
  type TemplateTheme,
  type Direction,
} from '@/lib/template-contract';
import { getVariants, typewriterChild, resolveScenePreset } from '@/lib/animation-presets';
import { cssFamily } from '@/lib/fonts';
import { FamiliesScene, EventScene, VenueScene, RsvpScene, GiftScene, Flourish } from './InvitationScenes';
import { hexLuminance, readableOn } from './color';

// Re-exported: the Player and the gallery stage pick gate/sheet ink with these.
export { hexLuminance, readableOn };

export interface SceneRenderProps {
  scene: SceneDef;
  step: BoundStep;
  theme: TemplateTheme;
  direction: Direction;
  recipientName: string;
  reducedMotion: boolean;
  active: boolean;
  /** Card-level field values (couple's names, wedding date…). */
  fields?: Record<string, string>;
}

/* ─────────────────────────── slot-driven readers ────────────────────────── */

interface TextBlock {
  key: string;
  value: string;
  animation?: string;
}

function textBlocks(
  scene: SceneDef,
  step: BoundStep,
  recipient: string,
  fields: Record<string, string> = {},
): TextBlock[] {
  return scene.slots
    .filter((s) => s.type === 'text')
    .map((s) => ({
      key: s.key,
      // slotValue honours bind/fallback to card-level fields; applyTokens then
      // resolves {recipient} and {field} tokens inside free text.
      value: applyTokens(slotValue(scene, step, s.key, fields), recipient, fields),
      animation: s.animation,
    }))
    .filter((b) => b.value.trim().length > 0);
}

function dateValue(
  scene: SceneDef,
  step: BoundStep,
  recipient: string,
  fields: Record<string, string> = {},
): string {
  const slot = scene.slots.find((s) => s.type === 'date');
  if (!slot) return '';
  return applyTokens(slotValue(scene, step, slot.key, fields), recipient, fields).trim();
}

/**
 * A date slot as the reader should see it ("12 March 2026" / "١٢ مارس ٢٠٢٦").
 * Date-only values (`2026-03-12`) are formatted in UTC so the day never slips
 * by one for a reader west of Greenwich.
 */
function formatDate(raw: string, direction: Direction): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  return new Intl.DateTimeFormat(direction === 'rtl' ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(dateOnly ? { timeZone: 'UTC' } : {}),
  }).format(d);
}

function sceneImages(scene: SceneDef, step: BoundStep): BoundMedia[] {
  const imageKeys = new Set(scene.slots.filter((s) => s.type === 'image').map((s) => s.key));
  if (imageKeys.size === 0) return [];
  const matched = step.media.filter(
    (m) => imageKeys.has(m.slot) || m.slot === 'image' || m.slot === 'gallery',
  );
  return matched.length > 0 ? matched : step.media;
}

/* ──────────────────────────── style resolution ──────────────────────────── */

// Sized in container-query units (cqw) so headings scale to the PLAYER's width
// — correct in both the narrow builder phone-preview and the full-screen player.
// Falls back to vw where container queries are unsupported.
const HEADING_SIZES: Record<NonNullable<SceneStyle['headingSize']>, string> = {
  sm: 'clamp(1.25rem, 7cqw, 2rem)',
  md: 'clamp(1.5rem, 8.5cqw, 2.75rem)',
  lg: 'clamp(1.75rem, 10cqw, 3.5rem)',
  xl: 'clamp(2rem, 12cqw, 4.5rem)',
  '2xl': 'clamp(2.25rem, 14cqw, 5.5rem)',
};

interface Resolved {
  textColor: string;
  headingColor: string;
  align: 'start' | 'center' | 'end';
  position: 'center' | 'top' | 'bottom';
  headingSize: string;
  headingFamily: string;
  imageStyle: NonNullable<SceneStyle['imageStyle']>;
  accent: string;
}

function resolveStyle(scene: SceneDef, theme: TemplateTheme, fallbackSize: SceneStyle['headingSize'] = 'lg'): Resolved {
  const s: Partial<SceneStyle> = scene.style ?? {};
  const baseColor = theme.textColor ?? '#FFFFFF';
  return {
    textColor: s.bodyColor ?? baseColor,
    headingColor: s.headingColor ?? baseColor,
    align: s.textAlign ?? 'center',
    position: s.textPosition ?? 'center',
    headingSize: HEADING_SIZES[s.headingSize ?? fallbackSize],
    headingFamily: cssFamily(s.headingFont ?? theme.fontHeading),
    imageStyle: s.imageStyle ?? 'rounded',
    accent: theme.accent ?? '#FFFFFF',
  };
}

const alignItems: Record<Resolved['align'], string> = {
  start: 'items-start text-start',
  center: 'items-center text-center',
  end: 'items-end text-end',
};
const justify: Record<Resolved['position'], string> = {
  center: 'justify-center',
  top: 'justify-start pt-[14vh]',
  bottom: 'justify-end pb-[14vh]',
};

function frameClass(style: Resolved['imageStyle']): string {
  switch (style) {
    case 'circle':
      return 'rounded-full aspect-square object-cover ring-4 ring-white/40';
    case 'full':
      return 'rounded-2xl object-cover';
    case 'polaroid':
      return 'rounded-sm object-cover bg-white p-2 pb-8 shadow-[var(--shadow-pop)]';
    case 'card':
      return 'rounded-xl object-cover shadow-[var(--shadow-pop)] ring-1 ring-white/20';
    case 'tilt':
      return 'rounded-xl object-cover shadow-[var(--shadow-pop)] -rotate-2';
    case 'arch':
      // Chapel-window crop: full radius on top, square feet.
      return 'object-cover rounded-t-full rounded-b-md ring-1 ring-white/40 shadow-[var(--shadow-pop)]';
    case 'ornate':
      // Gilt frame — the ring colour comes from the template's own accent.
      return 'object-cover rounded-md shadow-[var(--shadow-pop)] ring-[3px] ring-offset-2 ring-offset-black/20 ring-[color:var(--scene-accent)]';
    case 'taped':
      return 'object-cover rounded-sm bg-white p-2 pb-7 shadow-[var(--shadow-pop)] rotate-[-2.5deg]';
    default:
      return 'rounded-xl object-cover shadow-[var(--shadow-pop)]';
  }
}

/* ───────────────────────────── shared bits ──────────────────────────────── */

function sceneInPreset(scene: SceneDef) {
  return resolveScenePreset(scene.transitionIn?.preset);
}

/**
 * A soft shadow lifts LIGHT type off a dark or photographic ground; under dark
 * ink on paper the same shadow just reads as a smudge.
 */
function liftFor(color: string, strong = true): string {
  if (!/^#[0-9a-f]{3,8}$/i.test(color) || hexLuminance(color) < 0.5) return '';
  return strong ? 'drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]' : 'drop-shadow-[0_1px_8px_rgba(0,0,0,0.2)]';
}

/**
 * The small flourish that opens a mid-card section, so expressive sections
 * share the invitation sections' rhythm and the card reads as one designed
 * piece rather than a stack of unrelated blocks.
 */
function SectionRule({ theme, r }: { theme: TemplateTheme; r: Resolved }) {
  return (
    <div className="mb-token-4 w-full opacity-80">
      <Flourish color={r.accent} art={theme.art?.divider} width={132} />
    </div>
  );
}

function Heading({ text, r }: { text: string; r: Resolved }) {
  if (!text) return null;
  return (
    // h2, not h1: a card stacks many sections on one page, and gallery
    // thumbnails render these too — neither should add page-level h1s.
    <h2
      className={`font-bold leading-[1.15] ${liftFor(r.headingColor)} [text-wrap:balance] [overflow-wrap:anywhere]`}
      style={{ color: r.headingColor, fontSize: r.headingSize, fontFamily: r.headingFamily }}
    >
      {text}
    </h2>
  );
}

function Body({ text, r }: { text: string; r: Resolved }) {
  if (!text) return null;
  return (
    <p
      className={`mt-token-3 max-w-prose whitespace-pre-line text-lg leading-relaxed ${liftFor(r.textColor, false)} md:text-xl [overflow-wrap:anywhere]`}
      style={{ color: r.textColor, opacity: 0.95 }}
    >
      {text}
    </p>
  );
}

function TypewriterHeading({
  text,
  r,
  direction,
  reducedMotion,
  active,
}: {
  text: string;
  r: Resolved;
  direction: Direction;
  reducedMotion: boolean;
  active: boolean;
}) {
  const variants = getVariants('typewriter', { direction, reducedMotion });
  // Arabic is a joined script: splitting a word into per-letter elements
  // breaks the joins in several engines (Safari especially), so letters render
  // in their isolated forms. RTL types in word by word instead.
  const pieces = text.split(/(\s+)/).filter(Boolean);
  return (
    <motion.h2
      className={`font-bold leading-[1.15] ${liftFor(r.headingColor)} [overflow-wrap:anywhere]`}
      style={{ color: r.headingColor, fontSize: r.headingSize, fontFamily: r.headingFamily }}
      variants={variants}
      initial="hidden"
      animate={active ? 'visible' : 'hidden'}
      aria-label={text}
    >
      {pieces.map((piece, i) =>
        /^\s+$/.test(piece) ? (
          // A real space between words, so the heading still wraps at word
          // boundaries instead of breaking mid-word.
          <span key={i} aria-hidden>
            {' '}
          </span>
        ) : direction === 'rtl' ? (
          <motion.span key={i} variants={typewriterChild} aria-hidden>
            {piece}
          </motion.span>
        ) : (
          <span key={i} aria-hidden className="whitespace-nowrap">
            {piece.split('').map((ch, j) => (
              <motion.span key={j} variants={typewriterChild}>
                {ch}
              </motion.span>
            ))}
          </span>
        ),
      )}
    </motion.h2>
  );
}

function TextStack({
  blocks,
  r,
  direction,
  reducedMotion,
  active,
  typewriter = false,
}: {
  blocks: TextBlock[];
  r: Resolved;
  direction: Direction;
  reducedMotion: boolean;
  active: boolean;
  typewriter?: boolean;
}) {
  if (blocks.length === 0) return null;
  const [first, ...rest] = blocks;
  const wantsTypewriter = typewriter || first.animation === 'typewriter';
  return (
    <>
      {wantsTypewriter && !reducedMotion ? (
        <TypewriterHeading text={first.value} r={r} direction={direction} reducedMotion={reducedMotion} active={active} />
      ) : (
        <Heading text={first.value} r={r} />
      )}
      {rest.map((b) => (
        <Body key={b.key} text={b.value} r={r} />
      ))}
    </>
  );
}

/** Standard flex frame honoring align + vertical position. */
function Frame({ r, children }: { r: Resolved; children: React.ReactNode }) {
  return (
    <div
      className={`relative z-[1] flex h-full w-full flex-col px-token-6 ${alignItems[r.align]} ${justify[r.position]}`}
      style={{ ['--scene-accent' as string]: r.accent }}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── scene-type switch ────────────────────────────── */

/**
 * One renderer per scene type. A `Record` over `SceneType` rather than a
 * switch with a default: adding a type to the contract without a renderer is
 * then a compile error, instead of that scene silently rendering as text.
 */
export const SCENE_RENDERERS: Record<SceneType, (p: SceneRenderProps) => React.ReactElement | null> = {
  Cover: CoverScene,
  PhotoReveal: PhotoRevealScene,
  TextReveal: TextRevealScene,
  Countdown: CountdownScene,
  Gallery: GalleryScene,
  GiftReveal: GiftRevealScene,
  Finale: FinaleScene,
  Quote: QuoteScene,
  Letter: LetterScene,
  Families: FamiliesScene,
  Event: EventScene,
  Venue: VenueScene,
  Rsvp: RsvpScene,
  Gift: GiftScene,
};

export function SceneRenderer(props: SceneRenderProps) {
  // Unknown types can still arrive from an older definition stored in the DB.
  const Render = SCENE_RENDERERS[props.scene.type] ?? TextRevealScene;
  return <Render {...props} />;
}

/* ───────────────────────────── scenes ───────────────────────────────────── */

function CoverScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme, 'xl');
  const variants = getVariants(sceneInPreset(p.scene), {
    direction: p.direction,
    durationMs: p.scene.transitionIn?.durationMs,
    reducedMotion: p.reducedMotion,
  });
  const images = sceneImages(p.scene, p.step);
  const blocks = textBlocks(p.scene, p.step, p.recipientName, p.fields);
  return (
    <Frame r={r}>
      <motion.div
        className={`flex flex-col ${alignItems[r.align]}`}
        variants={variants}
        initial="hidden"
        animate={p.active ? 'visible' : 'hidden'}
        exit="exit"
      >
        {images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[0].url} alt="" className={`mb-token-6 h-44 w-44 ${frameClass(r.imageStyle === 'rounded' ? 'circle' : r.imageStyle)}`} />
        ) : null}
        <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} />
      </motion.div>
    </Frame>
  );
}

function PhotoRevealScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme);
  const variants = getVariants(p.scene.transitionIn?.preset ?? 'zoom', {
    direction: p.direction,
    durationMs: p.scene.transitionIn?.durationMs,
    reducedMotion: p.reducedMotion,
  });
  const images = sceneImages(p.scene, p.step);
  const blocks = textBlocks(p.scene, p.step, p.recipientName, p.fields);
  return (
    <Frame r={r}>
      {images[0] ? (
        <motion.img
          src={images[0].url}
          alt=""
          variants={variants}
          initial="hidden"
          animate={p.active ? 'visible' : 'hidden'}
          exit="exit"
          // Sized against the SECTION (cqw), not the window: in the builder's
          // phone frame `58vh` is the browser's height, far taller than the phone.
          className={`mb-token-6 max-h-[min(58vh,112cqw)] w-auto max-w-[86cqw] ${frameClass(r.imageStyle)}`}
        />
      ) : null}
      <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} />
    </Frame>
  );
}

function TextRevealScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme);
  const blocks = textBlocks(p.scene, p.step, p.recipientName, p.fields);
  // A date slot here is a fact in the list ("born 12 March"), so it is shown
  // formatted as the last line rather than silently dropped.
  const date = formatDate(dateValue(p.scene, p.step, p.recipientName, p.fields), p.direction);
  return (
    <Frame r={r}>
      <SectionRule theme={p.theme} r={r} />
      <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} typewriter />
      {date ? <Body text={date} r={r} /> : null}
    </Frame>
  );
}

function CountdownScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme);
  const target = dateValue(p.scene, p.step, p.recipientName, p.fields);
  const blocks = textBlocks(p.scene, p.step, p.recipientName, p.fields);
  const [remaining, setRemaining] = React.useState<{ d: number; h: number; m: number } | null>(null);
  React.useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      // Invalid or already passed: a row of "00" tiles reads as broken, so the
      // section keeps just its words.
      if (Number.isNaN(diff) || diff <= 0) return setRemaining(null);
      const clamped = diff;
      setRemaining({
        d: Math.floor(clamped / 86400000),
        h: Math.floor((clamped % 86400000) / 3600000),
        m: Math.floor((clamped % 3600000) / 60000),
      });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <Frame r={r}>
      <SectionRule theme={p.theme} r={r} />
      <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} />
      {remaining ? (
        <div className="mt-token-6 flex gap-token-4">
          {[
            { v: remaining.d, l: p.direction === 'rtl' ? 'يوم' : 'days' },
            { v: remaining.h, l: p.direction === 'rtl' ? 'ساعة' : 'hrs' },
            { v: remaining.m, l: p.direction === 'rtl' ? 'دقيقة' : 'min' },
          ].map((u) => (
            <div
              key={u.l}
              className="flex min-w-[4.5rem] flex-col items-center rounded-xl px-token-3 py-token-2"
              // Tinted from the template accent: a white/12 tile vanished on
              // the light paper palettes.
              style={{ background: `color-mix(in srgb, ${r.accent} 14%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${r.accent} 40%, transparent)` }}
            >
              <span className="text-4xl font-bold tabular-nums" style={{ color: r.headingColor, fontFamily: r.headingFamily }}>
                {/* Same numerals as the rest of the card — Arabic-Indic in RTL. */}
                {new Intl.NumberFormat(p.direction === 'rtl' ? 'ar-EG' : 'en-GB', { minimumIntegerDigits: 2 }).format(u.v)}
              </span>
              <span
                className={`text-xs ${p.direction === 'rtl' ? '' : 'uppercase tracking-wide'}`}
                style={{ color: r.textColor, opacity: 0.8 }}
              >
                {u.l}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </Frame>
  );
}

/**
 * Gallery — a depth carousel that advances on its own.
 *
 * A static grid shrinks every photo to a thumbnail; a carousel gives each one
 * the full frame in turn, which is what people actually want to look at. The
 * neighbours stay visible, scaled back and dimmed, so it reads as a stack you
 * are moving through rather than a slideshow that replaces itself.
 *
 * Falls back to a plain grid under reduced motion, where self-advancing
 * content is exactly what you are being asked not to do.
 */
const GALLERY_INTERVAL_MS = 1800;

function GalleryScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme, 'md');
  const images = sceneImages(p.scene, p.step);
  const blocks = textBlocks(p.scene, p.step, p.recipientName, p.fields);
  const count = images.length;
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (!p.active || p.reducedMotion || count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), GALLERY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [p.active, p.reducedMotion, count]);

  if (count === 0) {
    return (
      <Frame r={r}>
        <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} />
      </Frame>
    );
  }

  if (p.reducedMotion) {
    const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;
    return (
      <Frame r={r}>
        <div className="flex flex-col items-center gap-token-4">
          <SectionRule theme={p.theme} r={r} />
          <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion active={p.active} />
          <div className="grid w-full max-w-lg gap-token-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={img.url} alt="" className={`aspect-square w-full ${frameClass(r.imageStyle === 'rounded' ? 'card' : r.imageStyle)}`} />
            ))}
          </div>
        </div>
      </Frame>
    );
  }

  const frame = frameClass(r.imageStyle === 'rounded' ? 'card' : r.imageStyle);
  // Mirror the depth order in RTL so "next" travels the way the eye reads.
  const dir = p.direction === 'rtl' ? -1 : 1;

  return (
    <Frame r={r}>
      <div className="flex w-full flex-col items-center gap-token-4">
        <SectionRule theme={p.theme} r={r} />
        <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} />

        <div className="relative h-[46cqw] max-h-[min(52vh,60cqw)] w-full max-w-md" style={{ perspective: 1200 }}>
          {images.map((img, i) => {
            // Shortest signed distance around the ring.
            let d = i - index;
            if (d > count / 2) d -= count;
            if (d < -count / 2) d += count;
            const far = Math.abs(d) > 2;
            return (
              <motion.img
                key={i}
                src={img.url}
                alt=""
                className={`absolute left-1/2 top-1/2 h-full w-auto max-w-[78%] ${frame}`}
                style={{ transformOrigin: 'center' }}
                animate={{
                  x: `calc(-50% + ${d * 34 * dir}cqw)`,
                  y: '-50%',
                  scale: d === 0 ? 1 : 0.74,
                  opacity: far ? 0 : d === 0 ? 1 : 0.45,
                  zIndex: 10 - Math.abs(d),
                  rotateY: d * -18 * dir,
                }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              />
            );
          })}
        </div>

        <span className="text-xs tabular-nums" style={{ color: r.textColor, opacity: 0.7 }}>
          {index + 1} / {count}
        </span>
      </div>
    </Frame>
  );
}

function GiftRevealScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme);
  const variants = getVariants(p.scene.transitionIn?.preset ?? 'flip', {
    direction: p.direction,
    durationMs: p.scene.transitionIn?.durationMs,
    reducedMotion: p.reducedMotion,
  });
  const blocks = textBlocks(p.scene, p.step, p.recipientName, p.fields);
  // The sender's own photo of the gift, when they add one, IS the reveal; the
  // emoji is only the stand-in until then.
  const image = sceneImages(p.scene, p.step)[0];
  return (
    <Frame r={r}>
      <SectionRule theme={p.theme} r={r} />
      <motion.div
        className={`flex flex-col ${alignItems[r.align]}`}
        style={{ perspective: 1000 }}
        variants={variants}
        initial="hidden"
        animate={p.active ? 'visible' : 'hidden'}
        exit="exit"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt=""
            className={`mb-token-6 aspect-square w-[min(60cqw,260px)] ${frameClass(r.imageStyle)}`}
          />
        ) : (
          <div className="mb-token-6 text-7xl" aria-hidden>
            {p.scene.decoration?.emoji ?? '🎁'}
          </div>
        )}
        <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} />
      </motion.div>
    </Frame>
  );
}

function FinaleScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme, 'xl');
  const variants = getVariants(p.scene.transitionIn?.preset ?? 'glow', { direction: p.direction, reducedMotion: p.reducedMotion });
  const blocks = textBlocks(p.scene, p.step, p.recipientName, p.fields);
  return (
    <Frame r={r}>
      <motion.div
        className={`flex flex-col ${alignItems[r.align]}`}
        variants={variants}
        initial="hidden"
        animate={p.active ? 'visible' : 'hidden'}
        exit="exit"
      >
        <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} />
      </motion.div>
    </Frame>
  );
}

function QuoteScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme, 'xl');
  const variants = getVariants(p.scene.transitionIn?.preset ?? 'blurIn', {
    direction: p.direction,
    durationMs: p.scene.transitionIn?.durationMs,
    reducedMotion: p.reducedMotion,
  });
  const blocks = textBlocks(p.scene, p.step, p.recipientName, p.fields);
  const [quote, ...rest] = blocks;
  return (
    <Frame r={r}>
      <motion.div
        className={`flex max-w-2xl flex-col ${alignItems[r.align]}`}
        variants={variants}
        initial="hidden"
        animate={p.active ? 'visible' : 'hidden'}
        exit="exit"
      >
        <span aria-hidden className="text-7xl leading-none opacity-40" style={{ color: r.headingColor, fontFamily: r.headingFamily }}>
          {p.direction === 'rtl' ? '”' : '“'}
        </span>
        {quote ? (
          <p
            // No synthetic italic or letter-spacing in Arabic: slanting a
            // joined script and spacing its letters apart both break it.
            className={`font-semibold leading-snug [text-wrap:balance] ${p.direction === 'rtl' ? '' : 'italic'}`}
            style={{ color: r.headingColor, fontSize: r.headingSize, fontFamily: r.headingFamily }}
          >
            {quote.value}
          </p>
        ) : null}
        {rest.map((b) => (
          <p
            key={b.key}
            className={`mt-token-4 text-base ${p.direction === 'rtl' ? '' : 'uppercase tracking-[0.2em]'}`}
            style={{ color: r.textColor, opacity: 0.85 }}
          >
            — {b.value}
          </p>
        ))}
      </motion.div>
    </Frame>
  );
}

function LetterScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme, 'md');
  const variants = getVariants(p.scene.transitionIn?.preset ?? 'rise', {
    direction: p.direction,
    durationMs: p.scene.transitionIn?.durationMs,
    reducedMotion: p.reducedMotion,
  });
  const blocks = textBlocks(p.scene, p.step, p.recipientName, p.fields);
  const [heading, ...body] = blocks;
  // The letter is a sheet of paper laid on the card: take the lightest palette
  // entry for the sheet and whatever reads on it for the writing.
  const palette = p.theme.palette ?? [];
  const paper =
    [...palette].sort((a, b) => hexLuminance(b) - hexLuminance(a))[0] ?? '#F7F2E8';
  const letterInk = readableOn(paper, palette);
  // Sign in the accent only when it actually reads on the sheet — a pastel
  // accent (the newborn peach) on cream paper would all but disappear.
  const accentReads =
    /^#[0-9a-f]{3,8}$/i.test(r.accent) && Math.abs(hexLuminance(r.accent) - hexLuminance(paper)) > 0.3;
  const signInk = accentReads ? r.accent : letterInk;
  return (
    <Frame r={r}>
      <motion.div
        className="w-full max-w-md rounded-2xl p-token-8 text-start shadow-[var(--shadow-pop)]"
        style={{ background: paper, boxShadow: `0 0 0 1px ${r.accent}55, var(--shadow-pop)` }}
        variants={variants}
        initial="hidden"
        animate={p.active ? 'visible' : 'hidden'}
        exit="exit"
        dir={p.direction}
      >
        {heading ? (
          <p
            className="font-heading text-2xl font-semibold"
            style={{ fontFamily: r.headingFamily, color: letterInk }}
          >
            {heading.value}
          </p>
        ) : null}
        {body.map((b) =>
          b.key === 'signoff' ? (
            // The signature closes the sheet, set in the display face at the
            // end edge the way a handwritten letter is signed.
            <p
              key={b.key}
              className="mt-token-6 whitespace-pre-line text-end text-xl font-semibold"
              style={{ fontFamily: r.headingFamily, color: signInk }}
            >
              {b.value}
            </p>
          ) : (
            <p
              key={b.key}
              className="mt-token-3 whitespace-pre-line text-lg leading-relaxed"
              style={{ color: letterInk, opacity: 0.82 }}
            >
              {b.value}
            </p>
          ),
        )}
      </motion.div>
    </Frame>
  );
}
