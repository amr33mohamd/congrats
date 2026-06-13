'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  applyTokens,
  type BoundStep,
  type SceneDef,
  type Direction,
} from '@/lib/template-contract';
import { getVariants, typewriterChild, resolveScenePreset } from '@/lib/animation-presets';

export interface SceneRenderProps {
  scene: SceneDef;
  step: BoundStep;
  direction: Direction;
  recipientName: string;
  reducedMotion: boolean;
  active: boolean;
}

function slotText(step: BoundStep, key: string, recipient: string): string {
  const raw = step.text?.[key] ?? '';
  return applyTokens(raw, recipient);
}
function slotMedia(step: BoundStep, key: string) {
  return step.media.filter((m) => m.slot === key);
}

/** Per-scene-type renderers. The Player picks one by scene.type. */
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
    default:
      return <TextRevealScene {...props} />;
  }
}

/* ───────────────────────────── helpers ────────────────────────────── */

function sceneInPreset(scene: SceneDef) {
  return resolveScenePreset(scene.transitionIn?.preset);
}

function Heading({ text }: { text: string }) {
  if (!text) return null;
  return (
    <h1 className="font-heading text-3xl font-bold leading-tight text-white drop-shadow md:text-5xl">
      {text}
    </h1>
  );
}
function Body({ text }: { text: string }) {
  if (!text) return null;
  return <p className="mt-token-4 max-w-prose text-lg text-white/90 md:text-xl">{text}</p>;
}

/* ───────────────────────────── scenes ─────────────────────────────── */

function CoverScene(p: SceneRenderProps) {
  const variants = getVariants(sceneInPreset(p.scene), {
    direction: p.direction,
    durationMs: p.scene.transitionIn?.durationMs,
    reducedMotion: p.reducedMotion,
  });
  const images = slotMedia(p.step, 'image');
  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center px-token-6 text-center"
      variants={variants}
      initial="hidden"
      animate={p.active ? 'visible' : 'hidden'}
      exit="exit"
    >
      {images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={images[0].url}
          alt=""
          className="mb-token-6 h-48 w-48 rounded-full object-cover ring-4 ring-white/40"
        />
      ) : null}
      <Heading text={slotText(p.step, 'heading', p.recipientName)} />
      <Body text={slotText(p.step, 'body', p.recipientName)} />
    </motion.div>
  );
}

function PhotoRevealScene(p: SceneRenderProps) {
  const variants = getVariants('zoom', {
    direction: p.direction,
    durationMs: p.scene.transitionIn?.durationMs,
    reducedMotion: p.reducedMotion,
  });
  const images = slotMedia(p.step, 'image');
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-token-6 text-center">
      {images[0] ? (
        <motion.img
          src={images[0].url}
          alt=""
          variants={variants}
          initial="hidden"
          animate={p.active ? 'visible' : 'hidden'}
          exit="exit"
          className="mb-token-6 max-h-[60vh] w-auto rounded-xl object-cover shadow-[var(--shadow-pop)]"
        />
      ) : null}
      <Heading text={slotText(p.step, 'heading', p.recipientName)} />
      <Body text={slotText(p.step, 'body', p.recipientName)} />
    </div>
  );
}

function TextRevealScene(p: SceneRenderProps) {
  const heading = slotText(p.step, 'heading', p.recipientName);
  const usesTypewriter = p.scene.slots.some((s) => s.animation === 'typewriter') || !p.reducedMotion;
  const containerVariants = getVariants('typewriter', {
    direction: p.direction,
    reducedMotion: p.reducedMotion,
  });

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-token-6 text-center">
      {usesTypewriter && !p.reducedMotion ? (
        <motion.h1
          className="font-heading text-3xl font-bold leading-tight text-white drop-shadow md:text-5xl"
          variants={containerVariants}
          initial="hidden"
          animate={p.active ? 'visible' : 'hidden'}
          aria-label={heading}
        >
          {heading.split('').map((ch, i) => (
            <motion.span key={i} variants={typewriterChild} aria-hidden>
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </motion.h1>
      ) : (
        <Heading text={heading} />
      )}
      <Body text={slotText(p.step, 'body', p.recipientName)} />
    </div>
  );
}

function CountdownScene(p: SceneRenderProps) {
  const target = slotText(p.step, 'date', p.recipientName);
  const [remaining, setRemaining] = React.useState<string>('');
  React.useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (Number.isNaN(diff)) return setRemaining('');
      const d = Math.max(0, Math.floor(diff / 86400000));
      const h = Math.max(0, Math.floor((diff % 86400000) / 3600000));
      setRemaining(`${d}d ${h}h`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-token-6 text-center">
      <Heading text={slotText(p.step, 'heading', p.recipientName)} />
      {remaining ? (
        <div className="mt-token-6 font-heading text-5xl font-bold tabular-nums text-white">
          {remaining}
        </div>
      ) : null}
    </div>
  );
}

function GalleryScene(p: SceneRenderProps) {
  const images = slotMedia(p.step, 'gallery');
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: p.reducedMotion ? 0 : 0.12 } },
  };
  const item = getVariants('parallax', { direction: p.direction, reducedMotion: p.reducedMotion });
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-token-4 px-token-6 text-center">
      <Heading text={slotText(p.step, 'heading', p.recipientName)} />
      <motion.div
        className="grid w-full max-w-lg grid-cols-2 gap-token-3"
        variants={container}
        initial="hidden"
        animate={p.active ? 'visible' : 'hidden'}
      >
        {images.map((img, i) => (
          <motion.img
            key={i}
            src={img.url}
            alt=""
            variants={item}
            className="aspect-square w-full rounded-lg object-cover shadow-[var(--shadow-card)]"
          />
        ))}
      </motion.div>
    </div>
  );
}

function GiftRevealScene(p: SceneRenderProps) {
  const variants = getVariants('flip', {
    direction: p.direction,
    durationMs: p.scene.transitionIn?.durationMs,
    reducedMotion: p.reducedMotion,
  });
  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center px-token-6 text-center"
      style={{ perspective: 1000 }}
      variants={variants}
      initial="hidden"
      animate={p.active ? 'visible' : 'hidden'}
      exit="exit"
    >
      <div className="mb-token-6 text-7xl" aria-hidden>
        🎁
      </div>
      <Heading text={slotText(p.step, 'heading', p.recipientName)} />
      <Body text={slotText(p.step, 'body', p.recipientName)} />
    </motion.div>
  );
}

function FinaleScene(p: SceneRenderProps) {
  React.useEffect(() => {
    if (!p.active || p.reducedMotion) return;
    let cancelled = false;
    const fire = () => {
      if (cancelled) return;
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        // mirror confetti angle by direction for symmetry
        angle: p.direction === 'rtl' ? 110 : 70,
      });
    };
    fire();
    const id = setTimeout(fire, 700);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [p.active, p.reducedMotion, p.direction]);

  const variants = getVariants('zoom', { direction: p.direction, reducedMotion: p.reducedMotion });
  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center px-token-6 text-center"
      variants={variants}
      initial="hidden"
      animate={p.active ? 'visible' : 'hidden'}
      exit="exit"
    >
      <Heading text={slotText(p.step, 'heading', p.recipientName)} />
      <Body text={slotText(p.step, 'body', p.recipientName)} />
    </motion.div>
  );
}
