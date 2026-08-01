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
    default:
      return 'rounded-xl object-cover shadow-[var(--shadow-pop)]';
  }
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
            { v: remaining.d, l: 'days' },
            { v: remaining.h, l: 'hrs' },
            { v: remaining.m, l: 'min' },
          ].map((u) => (
            <div key={u.l} className="flex min-w-[4.5rem] flex-col items-center rounded-xl bg-white/12 px-token-3 py-token-2 backdrop-blur-sm">
              <span className="font-heading text-4xl font-bold tabular-nums" style={{ color: r.headingColor }}>
                {String(u.v).padStart(2, '0')}
              </span>
              <span className="text-xs uppercase tracking-wide" style={{ color: r.textColor, opacity: 0.8 }}>
                {u.l}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </Frame>
  );
}

function GalleryScene(p: SceneRenderProps) {
  const r = resolveStyle(p.scene, p.theme, 'md');
  const images = sceneImages(p.scene, p.step);
  const blocks = textBlocks(p.scene, p.step, p.recipientName);
  const container = { hidden: {}, visible: { transition: { staggerChildren: p.reducedMotion ? 0 : 0.12 } } };
  const item = getVariants('parallax', { direction: p.direction, reducedMotion: p.reducedMotion });
  const cols = images.length <= 1 ? 1 : images.length <= 4 ? 2 : 3;
  return (
    <Frame r={r}>
      <div className="flex flex-col items-center gap-token-4">
        <TextStack blocks={blocks} r={r} direction={p.direction} reducedMotion={p.reducedMotion} active={p.active} />
        {images.length > 0 ? (
          <motion.div
            className="grid w-full max-w-lg gap-token-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            variants={container}
            initial="hidden"
            animate={p.active ? 'visible' : 'hidden'}
          >
            {images.map((img, i) => (
              <motion.img key={i} src={img.url} alt="" variants={item} className={`aspect-square w-full ${frameClass(r.imageStyle === 'rounded' ? 'card' : r.imageStyle)}`} />
            ))}
          </motion.div>
        ) : null}
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
  return (
    <Frame r={r}>
      <motion.div
        className="w-full max-w-md rounded-2xl bg-white/90 p-token-8 text-start shadow-[var(--shadow-pop)] ring-1 ring-black/5"
        variants={variants}
        initial="hidden"
        animate={p.active ? 'visible' : 'hidden'}
        exit="exit"
        dir={p.direction}
      >
        {heading ? (
          <p className="font-heading text-2xl font-semibold text-ink" style={{ fontFamily: r.headingFamily }}>
            {heading.value}
          </p>
        ) : null}
        {body.map((b) => (
          <p key={b.key} className="mt-token-3 text-lg leading-relaxed text-ink/80">
            {b.value}
          </p>
        ))}
      </motion.div>
    </Frame>
  );
}
