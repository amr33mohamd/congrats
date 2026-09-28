'use client';

import * as React from 'react';
import confetti from 'canvas-confetti';
import type { Decoration, Direction } from '@/lib/template-contract';

type Effect = Decoration['effect'];

const COUNTS: Record<NonNullable<Decoration['intensity']>, number> = {
  low: 10,
  medium: 18,
  high: 30,
};

/** Glyphs for emoji-based floaters. `null` → rendered as styled bubbles. */
const GLYPHS: Partial<Record<Effect, string[]>> = {
  hearts: ['❤️', '💕', '💗', '💞'],
  petals: ['🌸', '🌷', '🌺', '🍃'],
  sparkles: ['✨', '⭐', '🌟', '💫'],
  snow: ['❄️', '✻', '•'],
  balloons: ['🎈'],
  stars: ['⭐', '✦', '★', '✧'],
};

const FALLING: Effect[] = ['petals', 'snow'];
const TWINKLING: Effect[] = ['sparkles', 'stars'];

interface Particle {
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  opacity: number;
  glyph: string;
}

function buildParticles(effect: Effect, count: number, emoji?: string): Particle[] {
  const glyphs = effect === 'emoji' ? [emoji || '🎉'] : GLYPHS[effect] ?? ['•'];
  const list: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    list.push({
      left: rand(0, 100),
      size: rand(14, 34),
      delay: rand(0, 8),
      duration: rand(7, 15),
      drift: rand(-60, 60),
      spin: rand(-180, 180),
      opacity: rand(0.55, 0.95),
      glyph: glyphs[i % glyphs.length],
    });
  }
  return list;
}

/**
 * Confetti / fireworks while the section is on screen.
 *
 * Bursts paint into a canvas that lives INSIDE the section, never the
 * library's default canvas. That default is `position: fixed` over the whole
 * document, so a burst from one section painted over the entire page — out of
 * the builder's phone frame, across the template gallery, over the site
 * chrome. A scoped canvas is clipped by its section like every other layer.
 */
function useBurst(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  effect: Effect,
  active: boolean,
  reducedMotion: boolean,
  direction: Direction,
) {
  React.useEffect(() => {
    if (!active || reducedMotion) return;
    if (effect !== 'confetti' && effect !== 'fireworks') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // `useWorker: false`: the worker path transfers the canvas to an
    // OffscreenCanvas, which can happen only once per element — the next
    // mount (StrictMode, scrolling back into view) would throw.
    const fire = confetti.create(canvas, {
      resize: true,
      useWorker: false,
      disableForReducedMotion: true,
    });
    let cancelled = false;

    const confettiBurst = () => {
      void fire({
        particleCount: 60,
        spread: 72,
        origin: { y: 0.7 },
        angle: direction === 'rtl' ? 110 : 70,
        ticks: 160,
      });
    };
    const firework = () => {
      const x = 0.2 + Math.random() * 0.6;
      void fire({
        particleCount: 36,
        spread: 360,
        startVelocity: 24,
        ticks: 90,
        origin: { x, y: 0.35 + Math.random() * 0.2 },
      });
    };

    const run = effect === 'fireworks' ? firework : confettiBurst;
    run();
    const id = setInterval(() => {
      if (!cancelled) run();
    }, effect === 'fireworks' ? 900 : 1400);
    return () => {
      cancelled = true;
      clearInterval(id);
      // Drop in-flight particles so nothing keeps animating off-screen.
      fire.reset?.();
    };
  }, [canvasRef, effect, active, reducedMotion, direction]);
}

export function Decorations({
  decoration,
  direction,
  reducedMotion,
  active,
}: {
  decoration?: Decoration;
  direction: Direction;
  reducedMotion: boolean;
  /** The section is on screen. Off-screen every effect is paused or stopped. */
  active: boolean;
}) {
  const effect = decoration?.effect ?? 'none';
  const intensity = decoration?.intensity ?? 'medium';
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Rolled once per effect, not on every render: re-rolling whenever `active`
  // flipped made every petal jump to a new spot mid-fall. Client-only (after
  // mount) so server and client markup agree.
  const particles = React.useMemo(
    () => (mounted ? buildParticles(effect, COUNTS[intensity], decoration?.emoji) : []),
    [mounted, effect, intensity, decoration?.emoji],
  );

  useBurst(canvasRef, effect, active, reducedMotion, direction);

  if (effect === 'none') return null;

  if (effect === 'confetti' || effect === 'fireworks') {
    if (reducedMotion) return null;
    return (
      <canvas
        ref={canvasRef}
        aria-hidden
        data-testid="confetti-canvas"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    );
  }

  // CSS loops keep running off-screen unless told otherwise. Pausing (rather
  // than unmounting) leaves each particle where it was when you scroll back.
  const playState: React.CSSProperties['animationPlayState'] = active ? 'running' : 'paused';

  // Glow: soft pulsing radial blobs.
  if (effect === 'glow') {
    const color = decoration?.color ?? 'rgba(255,255,255,0.6)';
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute rounded-full blur-2xl"
            style={{
              left: `${15 + i * 30}%`,
              top: `${20 + (i % 2) * 40}%`,
              width: '40vmin',
              height: '40vmin',
              background: `radial-gradient(circle, ${color}, transparent 70%)`,
              // Settled glow under reduced motion (and before the loop starts)
              // so the layer still reads as warmth rather than vanishing.
              opacity: 0.3,
              animation: reducedMotion ? undefined : `deco-glow ${6 + i}s ease-in-out ${i * 1.2}s infinite`,
              animationPlayState: playState,
            }}
          />
        ))}
      </div>
    );
  }

  if (!mounted || reducedMotion) return null;

  const anim = FALLING.includes(effect) ? 'deco-fall' : TWINKLING.includes(effect) ? 'deco-twinkle' : 'deco-rise';
  const isBubble = effect === 'bubbles';

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: TWINKLING.includes(effect) ? `${(p.delay / 8) * 100}%` : undefined,
            bottom: anim === 'deco-rise' ? '-10%' : undefined,
            fontSize: isBubble ? undefined : `${p.size}px`,
            width: isBubble ? `${p.size}px` : undefined,
            height: isBubble ? `${p.size}px` : undefined,
            borderRadius: isBubble ? '9999px' : undefined,
            background: isBubble
              ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), ${decoration?.color ?? 'rgba(255,255,255,0.25)'} 60%, transparent)`
              : undefined,
            ['--deco-drift' as string]: `${p.drift}px`,
            ['--deco-spin' as string]: `${p.spin}deg`,
            ['--deco-opacity' as string]: `${p.opacity}`,
            animation: `${anim} ${p.duration}s linear ${p.delay}s infinite`,
            animationPlayState: playState,
            willChange: active ? 'transform, opacity' : undefined,
          }}
        >
          {isBubble ? '' : p.glyph}
        </span>
      ))}
    </div>
  );
}
