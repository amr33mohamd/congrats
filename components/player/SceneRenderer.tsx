'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  applyTokens,
  type BoundStep,
  type BoundMedia,
  type SceneDef,
  type SceneStyle,
  type TemplateTheme,
  type Direction,
} from '@/lib/template-contract';
import { getVariants, typewriterChild, resolveScenePreset } from '@/lib/animation-presets';
import { cssFamily } from '@/lib/fonts';
import { FamiliesScene, EventScene, VenueScene, RsvpScene, GiftScene } from './InvitationScenes';

export interface SceneRenderProps {
  scene: SceneDef;
  step: BoundStep;
  theme: TemplateTheme;
  direction: Direction;
  recipientName: string;
  reducedMotion: boolean;
  active: boolean;
}

/* ─────────────────────────── slot-driven readers ────────────────────────── */

interface TextBlock {
  key: string;
  value: string;
  animation?: string;
}

function textBlocks(scene: SceneDef, step: BoundStep, recipient: string): TextBlock[] {
  return scene.slots
    .filter((s) => s.type === 'text')
    .map((s) => ({
      key: s.key,
      value: applyTokens(step.text?.[s.key] ?? '', recipient),
      animation: s.animation,
    }))
    .filter((b) => b.value.trim().length > 0);
}

function dateValue(scene: SceneDef, step: BoundStep, recipient: string): string {
  const slot = scene.slots.find((s) => s.type === 'date');
  if (!slot) return '';
  return applyTokens(step.text?.[slot.key] ?? '', recipient).trim();
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

/** Relative luminance of a hex colour, 0 (black) → 1 (white). */
export function hexLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Pick the palette entry that reads best on `on`. Scenes that paint their own
 * panel (the letter card, the open gate) previously used `text-ink`, which is
 * an APP token — once the product went dark, `ink` became near-white and those
 * panels rendered white-on-white.
 */
export function readableOn(on: string, palette: string[]): string {
  const target = hexLuminance(on) > 0.5;
  const candidates = palette.filter((c) => /^#[0-9a-f]{3,8}$/i.test(c));
  let best = target ? '#1A1418' : '#FFFFFF';
  let bestGap = 0;
  for (const c of candidates) {
    const gap = Math.abs(hexLuminance(c) - hexLuminance(on));
    if (gap > bestGap) { bestGap = gap; best = c; }
  }
  return bestGap > 0.35 ? best : target ? '#1A1418' : '#FFFFFF';
}

/* ───────────────────────────── shared bits ──────────────────────────────── */

function sceneInPreset(scene: SceneDef) {
  return resolveScenePreset(scene.transitionIn?.preset);
}

function Heading({ text, r }: { text: string; r: Resolved }) {
  if (!text) return null;
  return (
    <h1
      className="font-bold leading-[1.08] drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)] [text-wrap:balance] [overflow-wrap:anywhere]"
      style={{ color: r.headingColor, fontSize: r.headingSize, fontFamily: r.headingFamily }}
    >
      {text}
    </h1>
  );
}

function Body({ text, r }: { text: string; r: Resolved }) {
  if (!text) return null;
  return (
    <p
      className="mt-token-3 max-w-prose text-lg leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.2)] md:text-xl [overflow-wrap:anywhere]"
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
  return (
    <motion.h1
      className="font-bold leading-[1.08] drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)] [overflow-wrap:anywhere]"
      style={{ color: r.headingColor, fontSize: r.headingSize, fontFamily: r.headingFamily }}
      variants={variants}
      initial="hidden"
      animate={active ? 'visible' : 'hidden'}
      aria-label={text}
    >
      {text.split('').map((ch, i) => (
        <motion.span key={i} variants={typewriterChild} aria-hidden>
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </motion.h1>
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

export function SceneRenderer(props: SceneRenderProps) {
  switch (props.scene.type) {
    case 'Cover':
      return <CoverScene {...props} />;
    case 'PhotoReveal':
      return <PhotoRevealScene {...props} />;
    case 'TextReveal':
      return <TextRevealScene {...props} />;
    case 'Countdown':
      return <CountdownScene {...props} />;
    case 'Gallery':
      return <GalleryScene {...props} />;
    case 'GiftReveal':
      return <GiftRevealScene {...props} />;
    case 'Finale':
      return <FinaleScene {...props} />;
    case 'Quote':
      return <QuoteScene {...props} />;
    case 'Letter':
      return <LetterScene {...props} />;
    case 'Families':
      return <FamiliesScene {...props} />;
    case 'Event':
      return <EventScene {...props} />;
    case 'Venue':
      return <VenueScene {...props} />;
    case 'Rsvp':
      return <RsvpScene {...props} />;
    case 'Gift':
      return <GiftScene {...props} />;
    default:
      return <TextRevealScene {...props} />;
  }
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
  const blocks = textBlocks(p.scene, p.step, p.recipientName);
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
  const blocks = textBlocks(p.scene, p.step, p.recipientName);
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
          className={`mb-token-6 max-h-[58vh] w-auto max-w-[86vw] ${frameClass(r.imageStyle)}`}
        />
      ) : null}
      <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} />
    </Frame>
  );
}

function TextRevealScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme);
  const blocks = textBlocks(p.scene, p.step, p.recipientName);
  return (
    <Frame r={r}>
      <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} typewriter />
    </Frame>
  );
}

function CountdownScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme);
  const target = dateValue(p.scene, p.step, p.recipientName);
  const blocks = textBlocks(p.scene, p.step, p.recipientName);
  const [remaining, setRemaining] = React.useState<{ d: number; h: number; m: number } | null>(null);
  React.useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (Number.isNaN(diff)) return setRemaining(null);
      const clamped = Math.max(0, diff);
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
      <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} />
      {remaining ? (
        <div className="mt-token-6 flex gap-token-4">
          {[
            { v: remaining.d, l: p.direction === 'rtl' ? 'يوم' : 'days' },
            { v: remaining.h, l: p.direction === 'rtl' ? 'ساعة' : 'hrs' },
            { v: remaining.m, l: p.direction === 'rtl' ? 'دقيقة' : 'min' },
          ].map((u) => (
            <div key={u.l} className="flex min-w-[4.5rem] flex-col items-center rounded-xl bg-white/12 px-token-3 py-token-2 backdrop-blur-sm">
              <span className="font-heading text-4xl font-bold tabular-nums" style={{ color: r.headingColor }}>
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
  const blocks = textBlocks(p.scene, p.step, p.recipientName);
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
        <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} />

        <div className="relative h-[46cqw] max-h-[52vh] w-full max-w-md" style={{ perspective: 1200 }}>
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
  const blocks = textBlocks(p.scene, p.step, p.recipientName);
  return (
    <Frame r={r}>
      <motion.div
        className={`flex flex-col ${alignItems[r.align]}`}
        style={{ perspective: 1000 }}
        variants={variants}
        initial="hidden"
        animate={p.active ? 'visible' : 'hidden'}
        exit="exit"
      >
        <div className="mb-token-6 text-7xl" aria-hidden>
          {p.scene.decoration?.emoji ?? '🎁'}
        </div>
        <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} />
      </motion.div>
    </Frame>
  );
}

function FinaleScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme, 'xl');
  const variants = getVariants(p.scene.transitionIn?.preset ?? 'glow', { direction: p.direction, reducedMotion: p.reducedMotion });
  const blocks = textBlocks(p.scene, p.step, p.recipientName);
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
  const blocks = textBlocks(p.scene, p.step, p.recipientName);
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
        <span aria-hidden className="font-heading text-7xl leading-none opacity-40" style={{ color: r.headingColor }}>
          “
        </span>
        {quote ? (
          <p
            className="font-heading font-semibold italic leading-snug [text-wrap:balance]"
            style={{ color: r.headingColor, fontSize: r.headingSize, fontFamily: r.headingFamily }}
          >
            {quote.value}
          </p>
        ) : null}
        {rest.map((b) => (
          <p key={b.key} className="mt-token-4 text-base uppercase tracking-[0.2em]" style={{ color: r.textColor, opacity: 0.85 }}>
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
  const blocks = textBlocks(p.scene, p.step, p.recipientName);
  const [heading, ...body] = blocks;
  // The letter is a sheet of paper laid on the card: take the lightest palette
  // entry for the sheet and whatever reads on it for the writing.
  const palette = p.theme.palette ?? [];
  const paper =
    [...palette].sort((a, b) => hexLuminance(b) - hexLuminance(a))[0] ?? '#F7F2E8';
  const letterInk = readableOn(paper, palette);
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
        {body.map((b) => (
          <p key={b.key} className="mt-token-3 text-lg leading-relaxed" style={{ color: letterInk, opacity: 0.82 }}>
            {b.value}
          </p>
        ))}
      </motion.div>
    </Frame>
  );
}
