/**
 * Animation presets → framer-motion variants. Direction-aware: 'slideStart' /
 * 'slideEnd' use logical start/end and mirror for RTL. `confettiBurst` is a
 * no-op visual variant (the actual confetti is fired imperatively in the Finale
 * scene via canvas-confetti).
 *
 * All presets honor a `reducedMotion` flag → collapse to a simple opacity fade.
 */
import type { Variants, Transition as MotionTransition } from 'framer-motion';
import type { AnimationPreset, Direction } from './template-contract';

export interface PresetOptions {
  direction: Direction;
  durationMs?: number;
  delayMs?: number;
  reducedMotion?: boolean;
}

const DEFAULT_DURATION = 0.8;

/** In RTL, inline-start is on the right → start offset is positive X. */
function startOffset(direction: Direction, distance = 48): number {
  return direction === 'rtl' ? distance : -distance;
}
function endOffset(direction: Direction, distance = 48): number {
  return direction === 'rtl' ? -distance : distance;
}

export function getVariants(
  preset: AnimationPreset,
  opts: PresetOptions,
): Variants {
  const duration = (opts.durationMs ?? DEFAULT_DURATION * 1000) / 1000;
  const delay = (opts.delayMs ?? 0) / 1000;
  const t: MotionTransition = {
    duration,
    delay,
    ease: [0.22, 1, 0.36, 1], // emphasized standard easing
  };

  if (opts.reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: Math.min(duration, 0.2), delay } },
      exit: { opacity: 0, transition: { duration: 0.15 } },
    };
  }

  switch (preset) {
    case 'fade':
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: t },
        exit: { opacity: 0, transition: { ...t, duration: duration * 0.6 } },
      };

    case 'slideStart':
      return {
        hidden: { opacity: 0, x: startOffset(opts.direction) },
        visible: { opacity: 1, x: 0, transition: t },
        exit: { opacity: 0, x: endOffset(opts.direction), transition: { ...t, duration: duration * 0.6 } },
      };

    case 'slideEnd':
      return {
        hidden: { opacity: 0, x: endOffset(opts.direction) },
        visible: { opacity: 1, x: 0, transition: t },
        exit: { opacity: 0, x: startOffset(opts.direction), transition: { ...t, duration: duration * 0.6 } },
      };

    case 'zoom':
      return {
        hidden: { opacity: 0, scale: 0.86 },
        visible: { opacity: 1, scale: 1, transition: t },
        exit: { opacity: 0, scale: 1.04, transition: { ...t, duration: duration * 0.6 } },
      };

    case 'parallax':
      return {
        hidden: { opacity: 0, y: 60 },
        visible: { opacity: 1, y: 0, transition: { ...t, duration: duration * 1.2 } },
        exit: { opacity: 0, y: -40, transition: { ...t, duration: duration * 0.6 } },
      };

    case 'flip':
      return {
        hidden: { opacity: 0, rotateY: opts.direction === 'rtl' ? -90 : 90 },
        visible: { opacity: 1, rotateY: 0, transition: t },
        exit: { opacity: 0, rotateY: opts.direction === 'rtl' ? 90 : -90, transition: { ...t, duration: duration * 0.6 } },
      };

    case 'typewriter':
      // Container reveals; per-character handled by the TextReveal renderer using
      // staggerChildren. Here we expose container + child variants via the same map.
      return {
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.035, delayChildren: delay },
        },
        exit: { opacity: 0, transition: { duration: 0.3 } },
      };

    case 'confettiBurst':
      // Visual container is a plain fade; confetti is fired imperatively.
      return {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: t },
        exit: { opacity: 0, transition: { duration: 0.3 } },
      };

    case 'rise':
      return {
        hidden: { opacity: 0, y: 36 },
        visible: { opacity: 1, y: 0, transition: t },
        exit: { opacity: 0, y: -24, transition: { ...t, duration: duration * 0.6 } },
      };

    case 'blurIn':
      return {
        hidden: { opacity: 0, filter: 'blur(14px)', scale: 1.04 },
        visible: { opacity: 1, filter: 'blur(0px)', scale: 1, transition: { ...t, duration: duration * 1.1 } },
        exit: { opacity: 0, filter: 'blur(8px)', transition: { ...t, duration: duration * 0.6 } },
      };

    case 'glow':
      return {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { ...t, type: 'spring', stiffness: 120, damping: 14 },
        },
        exit: { opacity: 0, scale: 1.08, transition: { ...t, duration: duration * 0.6 } },
      };

    case 'bounce':
      return {
        hidden: { opacity: 0, scale: 0.6, y: 20 },
        visible: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { type: 'spring', stiffness: 260, damping: 16, delay },
        },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
      };

    case 'float':
      return {
        hidden: { opacity: 0, y: 50, scale: 0.96 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: 'spring', stiffness: 90, damping: 14, delay },
        },
        exit: { opacity: 0, y: -30, transition: { ...t, duration: duration * 0.6 } },
      };

    case 'kenBurns':
      // Slow cinematic push-in; pairs with image scenes.
      return {
        hidden: { opacity: 0, scale: 1.18 },
        visible: { opacity: 1, scale: 1, transition: { duration: Math.max(duration, 6), ease: 'linear', delay } },
        exit: { opacity: 0, transition: { duration: 0.5 } },
      };

    case 'shimmer':
      return {
        hidden: { opacity: 0, x: startOffset(opts.direction, 24) },
        visible: { opacity: 1, x: 0, transition: { ...t, duration: duration * 1.1 } },
        exit: { opacity: 0, transition: { duration: 0.3 } },
      };

    default:
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: t },
        exit: { opacity: 0 },
      };
  }
}

/** Per-character child variant for the typewriter preset. */
export const typewriterChild: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

/** Map a scene's default scene-transition into a usable preset (fallback fade). */
export function resolveScenePreset(preset?: AnimationPreset): AnimationPreset {
  return preset ?? 'fade';
}
