'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { Background } from '@/lib/template-contract';

/** Resolve the base CSS `background` value for a scene (no image). */
export function backgroundCss(bg: Background | undefined, palette: string[]): string {
  const fallback =
    palette.length >= 2
      ? `linear-gradient(160deg, ${palette[1]}, ${palette[0]})`
      : 'linear-gradient(160deg, rgb(var(--c-brand-700)), rgb(var(--c-brand-500)))';
  if (!bg) return fallback;
  const colors = bg.colors.length ? bg.colors : palette;
  switch (bg.type) {
    case 'solid':
      return colors[0] ?? fallback;
    case 'radial':
      return `radial-gradient(circle at 50% 35%, ${colors.join(', ') || fallback})`;
    case 'gradient':
    case 'pattern':
      return colors.length >= 2
        ? `linear-gradient(${bg.angle ?? 160}deg, ${colors.join(', ')})`
        : fallback;
    case 'image':
      // Image handled separately; show a tonal base underneath while it loads.
      return colors.length >= 2
        ? `linear-gradient(${bg.angle ?? 160}deg, ${colors.join(', ')})`
        : fallback;
    default:
      return fallback;
  }
}

/** SVG/gradient pattern overlay (subtle, on top of the base). */
function patternLayer(pattern: Background['pattern']): React.CSSProperties | null {
  switch (pattern) {
    case 'dots':
      return {
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1.5px, transparent 1.6px)',
        backgroundSize: '22px 22px',
      };
    case 'confettiDots':
      return {
        backgroundImage:
          'radial-gradient(rgba(255,255,255,0.22) 2px, transparent 2.2px), radial-gradient(rgba(255,255,255,0.12) 2px, transparent 2.2px)',
        backgroundSize: '40px 40px, 40px 40px',
        backgroundPosition: '0 0, 20px 20px',
      };
    case 'grid':
      return {
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      };
    case 'diagonal':
      return {
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 14px, transparent 14px 28px)',
      };
    case 'damask': {
      // A brocade repeat, drawn once as an inline SVG tile. Kept very low
      // contrast: it should read as woven texture under the type, never as
      // wallpaper competing with it.
      const tile =
        "%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='120' viewBox='0 0 80 120'%3E" +
        "%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.055' stroke-width='1.1'%3E" +
        "%3Cpath d='M40 8 C52 22 52 38 40 52 C28 38 28 22 40 8 Z'/%3E" +
        "%3Cpath d='M40 20 C46 27 46 35 40 42 C34 35 34 27 40 20 Z'/%3E" +
        "%3Cpath d='M12 60 C24 46 32 54 40 60 C32 66 24 74 12 60 Z'/%3E" +
        "%3Cpath d='M68 60 C56 46 48 54 40 60 C48 66 56 74 68 60 Z'/%3E" +
        "%3Cpath d='M40 68 C52 82 52 98 40 112 C28 98 28 82 40 68 Z'/%3E" +
        "%3Cpath d='M0 0 C10 6 10 14 0 20 M80 0 C70 6 70 14 80 20'/%3E" +
        "%3Cpath d='M0 100 C10 106 10 114 0 120 M80 100 C70 106 70 114 80 120'/%3E" +
        "%3C/g%3E%3C/svg%3E";
      return {
        backgroundImage: `url("data:image/svg+xml,${tile}")`,
        backgroundSize: '80px 120px',
      };
    }
    case 'noise':
      return {
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      };
    default:
      return null;
  }
}

export function SceneBackground({
  background,
  palette,
  reducedMotion,
  active,
}: {
  background?: Background;
  palette: string[];
  reducedMotion: boolean;
  active: boolean;
}) {
  const base = backgroundCss(background, palette);
  const isImage = background?.type === 'image' && background.imageUrl;
  const pattern = background?.pattern ? patternLayer(background.pattern) : null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base color / gradient */}
      <div className="absolute inset-0" style={{ background: base }} />

      {/* Image layer (optional slow Ken Burns push-in) */}
      {isImage ? (
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${background!.imageUrl})`,
            filter: background!.blurPx ? `blur(${background!.blurPx}px)` : undefined,
          }}
          initial={{ scale: background!.kenBurns && !reducedMotion ? 1.02 : 1 }}
          animate={{ scale: active && background!.kenBurns && !reducedMotion ? 1.16 : 1 }}
          transition={{ duration: 14, ease: 'linear' }}
        />
      ) : null}

      {/* Pattern overlay */}
      {pattern ? <div className="absolute inset-0" style={pattern} /> : null}

      {/* Legibility overlay (esp. over images) */}
      {background?.overlay ? (
        <div className="absolute inset-0" style={{ background: background.overlay }} />
      ) : isImage ? (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.55))' }}
        />
      ) : null}
    </div>
  );
}
