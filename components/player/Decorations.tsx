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

function buildParticles(effect: Effect, count: number, color?: string, emoji?: string): Particle[] {
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

/** Imperative confetti / fireworks while the scene is active. */
function useBurst(effect: Effect, active: boolean, reducedMotion: boolean, direction: Direction) {
  React.useEffect(() => {
    if (!active || reducedMotion) return;
    if (effect !== 'confetti' && effect !== 'fireworks') return;
    let cancelled = false;

    const confettiBurst = () => {
      confetti({ particleCount: 70, spread: 72, origin: { y: 0.62 }, angle: direction === 'rtl' ? 110 : 70 });
    };
    const firework = () => {
      const x = 0.2 + Math.random() * 0.6;
      confetti({ particleCount: 40, spread: 360, startVelocity: 28, ticks: 90, origin: { x, y: 0.4 + Math.random() * 0.2 } });
    };

    const run = effect === 'fireworks' ? firework : confettiBurst;
    run();
    const id = setInterval(() => {
      if (!cancelled) run();
    }, effect === 'fireworks' ? 900 : 1400);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [effect, active, reducedMotion, direction]);
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
  active: boolean;
}) {
  const effect = decoration?.effect ?? 'none';
  const intensity = decoration?.intensity ?? 'medium';
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  useBurst(effect, active, reducedMotion, direction);

  if (effect === 'none' || effect === 'confetti' || effect === 'fireworks') return null;

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
              animation: reducedMotion ? undefined : `deco-glow ${6 + i}s ease-in-out ${i * 1.2}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  if (!mounted || reducedMotion) return null;

  const count = COUNTS[intensity];
  const particles = buildParticles(effect, count, decoration?.color, decoration?.emoji);
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
            bottom: anim === 'deco-rise' ? '-10vh' : undefined,
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
            willChange: 'transform, opacity',
          }}
        >
          {isBubble ? '' : p.glyph}
        </span>
      ))}
    </div>
  );
}
