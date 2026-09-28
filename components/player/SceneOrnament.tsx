import * as React from 'react';
import type { Ornament } from '@/lib/template-contract';

/**
 * Static decorative line-work drawn behind a scene's content.
 *
 * Deliberately vector and colour-driven rather than image assets: an ornament
 * has to sit on eight different palettes, mirror cleanly for RTL, and stay
 * crisp from a 240px gallery thumbnail up to a full-screen player. It is drawn
 * in a 390×693 viewBox — the same virtual card the preview composes at — and
 * stretched with `preserveAspectRatio="none"` only where that is safe.
 *
 * `Decorations` is the sibling of this file and handles ambient MOTION
 * (petals, confetti). This is the architecture: arches, wreaths, rules.
 */

const W = 390;
const H = 693;

/** Two mirrored floral sprigs, used by several motifs. */
function Sprig({ x, y, r, s, color }: { x: number; y: number; r: number; s: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} stroke={color} fill="none" strokeWidth="1.6">
      <path d="M0 0 C 14 -10, 30 -12, 46 -8" />
      {[6, 16, 26, 36].map((d, i) => (
        <g key={i} transform={`translate(${d} ${-d * 0.22})`}>
          <ellipse cx="0" cy="-5" rx="3.4" ry="6.2" fill={color} opacity="0.55" stroke="none" />
          <ellipse cx="3" cy="4" rx="5.6" ry="3.2" fill={color} opacity="0.35" stroke="none" />
        </g>
      ))}
      <circle cx="46" cy="-8" r="2.6" fill={color} stroke="none" />
    </g>
  );
}

function Arch({ c, o }: { c: string; o: number }) {
  return (
    <g stroke={c} fill="none" opacity={o}>
      <path
        d="M70 620 L70 250 A125 125 0 0 1 320 250 L320 620"
        strokeWidth="2.4"
      />
      <path
        d="M82 612 L82 252 A113 113 0 0 1 308 252 L308 612"
        strokeWidth="1"
        opacity="0.6"
      />
      {/* keystone */}
      <g transform="translate(195 128)">
        <path d="M0 -16 L7 0 L0 16 L-7 0 Z" fill={c} stroke="none" opacity="0.8" />
        <path d="M-22 0 H-10 M10 0 H22" strokeWidth="1.4" />
      </g>
    </g>
  );
}

function Wreath({ c, o }: { c: string; o: number }) {
  // Rounded on purpose. Unrounded trig serialises to a different last digit on
  // the server than in the browser (…5152 vs …5153), React flags the attribute
  // mismatch, gives up on patching the subtree — and the scene's text is left
  // stuck at its `initial="hidden"` opacity. Fixed precision keeps both sides
  // byte-identical.
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  const leaves = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2 - Math.PI / 2;
    const rx = 150;
    const ry = 205;
    return {
      x: r3(W / 2 + Math.cos(a) * rx),
      y: r3(H / 2 + Math.sin(a) * ry),
      rot: r3((a * 180) / Math.PI + 90),
      big: i % 3 === 0,
    };
  });
  return (
    <g opacity={o}>
      {leaves.map((l, i) => (
        <ellipse
          key={i}
          cx={l.x}
          cy={l.y}
          rx={l.big ? 6.5 : 4.5}
          ry={l.big ? 13 : 9}
          fill={c}
          opacity={l.big ? 0.65 : 0.4}
          transform={`rotate(${l.rot} ${l.x} ${l.y})`}
        />
      ))}
    </g>
  );
}

function Engraved({ c, o }: { c: string; o: number }) {
  const corner = (x: number, y: number, sx: number, sy: number) => (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`} stroke={c} fill="none" strokeWidth="1.5">
      <path d="M0 34 C 0 12, 12 0, 34 0" />
      <path d="M6 34 C 6 16, 16 6, 34 6" strokeWidth="0.9" opacity="0.7" />
      <circle cx="34" cy="34" r="2.2" fill={c} stroke="none" opacity="0.8" />
    </g>
  );
  return (
    <g opacity={o}>
      <rect x="34" y="34" width={W - 68} height={H - 68} stroke={c} strokeWidth="1.6" fill="none" />
      <rect x="44" y="44" width={W - 88} height={H - 88} stroke={c} strokeWidth="0.7" fill="none" opacity="0.6" />
      {corner(34, 34, 1, 1)}
      {corner(W - 34, 34, -1, 1)}
      {corner(34, H - 34, 1, -1)}
      {corner(W - 34, H - 34, -1, -1)}
    </g>
  );
}

function Corners({ c, o }: { c: string; o: number }) {
  return (
    <g opacity={o}>
      <g transform="translate(18 74)">
        <Sprig x={0} y={0} r={18} s={1.5} color={c} />
        <Sprig x={6} y={26} r={52} s={1.15} color={c} />
      </g>
      <g transform={`translate(${W - 18} ${H - 74}) rotate(180)`}>
        <Sprig x={0} y={0} r={18} s={1.5} color={c} />
        <Sprig x={6} y={26} r={52} s={1.15} color={c} />
      </g>
    </g>
  );
}

function Banner({ c, o }: { c: string; o: number }) {
  const band = (y: number, flip: number) => (
    <g transform={`translate(0 ${y}) scale(1 ${flip})`} stroke={c} fill="none">
      <path d={`M40 0 H${W - 40}`} strokeWidth="1.4" />
      <path d={`M60 9 H${W - 60}`} strokeWidth="0.7" opacity="0.6" />
      <g transform={`translate(${W / 2} 0)`}>
        <path d="M-26 0 L0 -11 L26 0 L0 11 Z" fill={c} stroke="none" opacity="0.75" />
        <circle cx="0" cy="0" r="3.2" fill={c} stroke="none" />
      </g>
      <Sprig x={44} y={26} r={-14} s={1} color={c} />
      <g transform={`translate(${W - 44} 26) scale(-1 1)`}>
        <Sprig x={0} y={0} r={-14} s={1} color={c} />
      </g>
    </g>
  );
  return (
    <g opacity={o}>
      {band(62, 1)}
      {band(H - 62, -1)}
    </g>
  );
}

function Monogram({ c, o }: { c: string; o: number }) {
  return (
    <g opacity={o} transform={`translate(${W / 2} 150)`}>
      <circle r="52" stroke={c} strokeWidth="1.3" fill="none" opacity="0.7" />
      <circle r="60" stroke={c} strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M-96 0 H-70 M70 0 H96" stroke={c} strokeWidth="1.2" />
      <path d="M0 -70 L6 -60 L0 -50 L-6 -60 Z" fill={c} stroke="none" opacity="0.85" />
      <Sprig x={-30} y={44} r={-28} s={0.85} color={c} />
      <g transform="translate(30 44) scale(-1 1)">
        <Sprig x={0} y={0} r={-28} s={0.85} color={c} />
      </g>
    </g>
  );
}


/** A layered peony: outer petals, inner whorl, centre. Reads at thumbnail size. */
function Peony({ x, y, s, c, accent }: { x: number; y: number; s: number; c: string; accent: string }) {
  const petals = 8;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {Array.from({ length: petals }, (_, i) => {
        const a = (i / petals) * 360;
        return (
          <ellipse key={`o${i}`} cx="0" cy="-13" rx="7.5" ry="13" fill={c} opacity="0.5"
            transform={`rotate(${a})`} />
        );
      })}
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse key={`i${i}`} cx="0" cy="-7" rx="5" ry="8" fill={c} opacity="0.75"
          transform={`rotate(${(i / 6) * 360 + 22})`} />
      ))}
      <circle r="4" fill={accent} opacity="0.95" />
    </g>
  );
}

/** Baroque acanthus scroll — the C-curve that carries the corner clusters. */
function Scroll({ c }: { c: string }) {
  return (
    <g stroke={c} fill="none" strokeWidth="2.2" strokeLinecap="round">
      <path d="M0 0 C 46 -6, 86 10, 108 44 C 120 64, 114 84, 96 88 C 80 92, 68 78, 74 64 C 80 52, 96 54, 98 66" />
      <path d="M8 16 C 44 12, 74 26, 90 50" strokeWidth="1.2" opacity="0.7" />
      <path d="M0 0 C -6 34, 10 64, 40 78 C 58 86, 74 78, 72 62" strokeWidth="1.6" opacity="0.85" />
      <path d="M26 6 C 30 -10, 46 -18, 58 -12" strokeWidth="1.2" opacity="0.6" />
      <path d="M-4 26 C -18 40, -16 60, -2 70" strokeWidth="1.2" opacity="0.55" />
    </g>
  );
}

/** Dense corner cluster: scrollwork plus a peony spray, bleeding off the edge. */
function Baroque({ c, o }: { c: string; o: number }) {
  const cluster = (
    <g>
      <Scroll c={c} />
      <g transform="translate(18 12) scale(1.05)">
        <Scroll c={c} />
      </g>
      <Peony x={26} y={30} s={1.15} c={c} accent={c} />
      <Peony x={74} y={70} s={0.85} c={c} accent={c} />
      <Peony x={4} y={78} s={0.7} c={c} accent={c} />
      <g opacity="0.75">
        <ellipse cx="96" cy="26" rx="6" ry="12" fill={c} opacity="0.45" transform="rotate(38 96 26)" />
        <ellipse cx="58" cy="96" rx="6" ry="12" fill={c} opacity="0.45" transform="rotate(-24 58 96)" />
        <ellipse cx="-14" cy="46" rx="5" ry="10" fill={c} opacity="0.4" transform="rotate(70 -14 46)" />
      </g>
    </g>
  );
  return (
    <g opacity={o}>
      {/* top-start, anchored past the edge so the motif bleeds */}
      <g transform="translate(-26 -18) scale(1.25)">{cluster}</g>
      {/* bottom-end, rotated 180° for a balanced diagonal */}
      <g transform={`translate(${W + 26} ${H + 18}) rotate(180) scale(1.25)`}>{cluster}</g>
    </g>
  );
}

/** Vertical floral columns down both edges, as on a bordered invitation. */
function Florals({ c, o }: { c: string; o: number }) {
  const column = (
    <g>
      <path d="M0 0 C 18 70, -12 140, 6 210 C 20 268, -6 330, 8 396" stroke={c} strokeWidth="1.6" fill="none" opacity="0.7" />
      {[30, 118, 206, 300, 380].map((y, i) => (
        <Peony key={i} x={i % 2 ? 22 : -6} y={y} s={i % 2 ? 0.72 : 0.95} c={c} accent={c} />
      ))}
      {[70, 160, 252, 342].map((y, i) => (
        <ellipse key={`l${i}`} cx={i % 2 ? -12 : 26} cy={y} rx="5.5" ry="12" fill={c} opacity="0.4"
          transform={`rotate(${i % 2 ? -40 : 40} ${i % 2 ? -12 : 26} ${y})`} />
      ))}
    </g>
  );
  return (
    <g opacity={o}>
      <g transform="translate(26 132)">{column}</g>
      <g transform={`translate(${W - 26} 132) scale(-1 1)`}>{column}</g>
    </g>
  );
}

const MOTIFS: Record<string, React.FC<{ c: string; o: number }>> = {
  arch: Arch,
  wreath: Wreath,
  engraved: Engraved,
  corners: Corners,
  banner: Banner,
  monogram: Monogram,
  baroque: Baroque,
  florals: Florals,
};

export function SceneOrnament({
  ornament,
  accent,
  direction,
}: {
  ornament?: Ornament;
  accent?: string;
  direction: 'rtl' | 'ltr';
}) {
  if (!ornament || ornament.kind === 'none') return null;
  const Motif = MOTIFS[ornament.kind];
  if (!Motif) return null;

  const color = ornament.color ?? accent ?? '#FFFFFF';
  const scale = ornament.scale ?? 1;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${W} ${H}`}
      // `meet`, not `slice`. The motifs are composed in a 390×693 portrait box
      // and anchored to its corners; `slice` scaled that box to cover a wide
      // desktop viewport and pushed every corner cluster off-screen, so the
      // ornament vanished on anything but a phone. `meet` fits the box instead,
      // keeping the frame intact at any aspect ratio.
      preserveAspectRatio="xMidYMid meet"
      // Asymmetric motifs read as "leaning the wrong way" in RTL; mirroring the
      // whole layer keeps the composition balanced in both directions.
      style={{ transform: direction === 'rtl' ? 'scaleX(-1)' : undefined }}
    >
      <g
        transform={`translate(${W / 2} ${H / 2}) scale(${scale}) translate(${-W / 2} ${-H / 2})`}
      >
        <Motif c={color} o={ornament.opacity ?? 0.85} />
      </g>
    </svg>
  );
}
