/**
 * Inline artwork for the "theatre" (Golden Era) invitation: the couple's
 * monogram on the cover, a crystal chandelier over the event details, small
 * calendar/clock marks beside the date and time, and an old Cairo palace
 * façade with fountains under the sign-off. Line art in the accent colour,
 * drawn from scratch so it scales from a gallery thumbnail to full screen.
 */
import * as React from 'react';

export const isTheatre = (theme: { ornament?: { kind?: string } } | undefined) =>
  theme?.ornament?.kind === 'theatre';

/** "Omar & Nour" / "عمر و نور" → ["O", "N"] / ["ع", "ن"]. */
export function initialsOf(names: string): [string, string] | null {
  const parts = names
    // `\b` is ASCII-only in JS, so the Arabic and English joiners need real spaces.
    .split(/\s*(?:&|＆|\+)\s*|\s+(?:و|and)\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const first = (s: string) => Array.from(s)[0]?.toUpperCase() ?? '';
  return [first(parts[0]!), first(parts[parts.length - 1]!)];
}

/** Two interlaced initials with a hairline crown, as on an engraved invitation. */
export function Monogram({ names, color, font }: { names: string; color: string; font: string }) {
  const ini = initialsOf(names);
  if (!ini) return null;
  return (
    <svg aria-hidden viewBox="0 0 140 150" className="mx-auto mb-token-4 h-28 w-auto" style={{ color }}>
      <path d="M70 6 L74 14 L70 22 L66 14 Z" fill="currentColor" />
      <path d="M40 24 C 54 16, 86 16, 100 24" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.7" />
      <text x="56" y="92" textAnchor="middle" fontSize="70" fill="currentColor" style={{ fontFamily: font }}>
        {ini[0]}
      </text>
      <text x="84" y="118" textAnchor="middle" fontSize="70" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ fontFamily: font }}>
        {ini[1]}
      </text>
      <path d="M70 128 V146" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

/** A tiered crystal chandelier hanging from a chain. */
export function Chandelier({ color }: { color: string }) {
  const drops = (y: number, n: number, w: number) =>
    Array.from({ length: n }, (_, i) => {
      const x = 80 - w / 2 + (w / (n - 1)) * i;
      return (
        <g key={`${y}-${i}`}>
          <path d={`M${x} ${y} V${y + 9}`} stroke="currentColor" strokeWidth="0.7" />
          <path d={`M${x} ${y + 9} l-3 6 l3 6 l3 -6 Z`} fill="currentColor" opacity="0.85" />
        </g>
      );
    });
  return (
    <svg aria-hidden viewBox="0 0 160 170" className="mx-auto mb-token-3 h-32 w-auto" style={{ color }}>
      <g stroke="currentColor" fill="none" strokeWidth="1.4" strokeLinecap="round">
        <path d="M80 0 V30" strokeDasharray="3 2" />
        <circle cx="80" cy="34" r="4" />
        <path d="M80 38 V120" strokeWidth="2.2" />
        <path d="M80 52 C 60 52, 40 58, 30 72 M80 52 C 100 52, 120 58, 130 72" />
        <path d="M80 70 C 54 70, 26 80, 14 100 M80 70 C 106 70, 134 80, 146 100" />
        <path d="M24 96 H136 M30 76 H130" opacity="0.6" />
        <path d="M70 120 C 70 132, 90 132, 90 120 Z" fill="currentColor" fillOpacity="0.25" />
        {[30, 55, 80, 105, 130].map((x) => (
          <g key={x}>
            <path d={`M${x} ${x === 80 ? 46 : 64} v-10`} strokeWidth="2.4" />
            <path d={`M${x} ${x === 80 ? 36 : 54} c -3 -5, 3 -8, 0 -12`} strokeWidth="1" />
          </g>
        ))}
      </g>
      {drops(76, 7, 100)}
      {drops(100, 9, 132)}
      <path d="M80 132 v10" stroke="currentColor" strokeWidth="0.8" />
      <path d="M80 142 l-4 8 l4 8 l4 -8 Z" fill="currentColor" />
    </svg>
  );
}

export function CalendarMark({ color }: { color: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="inline-block h-5 w-5 align-[-3px]" style={{ color }}>
      <g stroke="currentColor" fill="none" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10 H21 M8 3 V7 M16 3 V7" />
        <path d="M7 14 h2 M11 14 h2 M15 14 h2 M7 17 h2 M11 17 h2" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function ClockMark({ color }: { color: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="inline-block h-5 w-5 align-[-3px]" style={{ color }}>
      <g stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 2 V5 M10 2 H14 M12 13 V9 M12 13 L15 15" />
      </g>
    </svg>
  );
}

/** A palace façade with a central dome, arcades and two fountains in front. */
export function PalaceFacade({ color }: { color: string }) {
  const arches = (x0: number, n: number, w: number, y: number, h: number) =>
    Array.from({ length: n }, (_, i) => {
      const x = x0 + i * w;
      return <path key={`${x0}-${i}`} d={`M${x + 3} ${y + h} V${y + 10} C ${x + 3} ${y}, ${x + w - 3} ${y}, ${x + w - 3} ${y + 10} V${y + h}`} />;
    });
  const fountain = (cx: number) => (
    <g>
      <path d={`M${cx - 26} 214 C ${cx - 20} 222, ${cx + 20} 222, ${cx + 26} 214`} />
      <path d={`M${cx - 30} 214 H${cx + 30}`} />
      <path d={`M${cx} 214 V190`} strokeWidth="2" />
      <path d={`M${cx - 12} 190 C ${cx - 8} 196, ${cx + 8} 196, ${cx + 12} 190 Z`} />
      <path d={`M${cx} 188 C ${cx - 4} 176, ${cx - 14} 176, ${cx - 20} 196 M${cx} 188 C ${cx + 4} 176, ${cx + 14} 176, ${cx + 20} 196`} strokeDasharray="2 3" opacity="0.8" />
    </g>
  );
  return (
    <svg aria-hidden viewBox="0 0 390 230" className="block w-full" style={{ color }} preserveAspectRatio="xMidYMax meet">
      <g stroke="currentColor" fill="none" strokeWidth="1.3" strokeLinejoin="round">
        {/* dome + drum */}
        <path d="M150 70 C 150 20, 240 20, 240 70" />
        {/* finial: spire, knob and crescent */}
        <path d="M195 26 V16" />
        <circle cx="195" cy="13" r="2.5" fill="currentColor" />
        <path d="M199 2 A 6 6 0 1 0 199 10 A 4.6 4.6 0 1 1 199 2 Z" fill="currentColor" stroke="none" />
        <path d="M144 70 H246 V84 H144 Z" />
        {/* central block */}
        <path d="M120 84 H270 V180 H120 Z" />
        {arches(130, 5, 26, 100, 80)}
        {/* wings */}
        <path d="M20 112 H120 V180 H20 Z M270 112 H370 V180 H270 Z" />
        {arches(26, 4, 23, 124, 56)}
        {arches(276, 4, 23, 124, 56)}
        <path d="M14 112 H126 M264 112 H376" strokeWidth="2" />
        {/* minarets */}
        <path d="M8 180 V92 C 8 80, 20 80, 20 92 V180 M370 180 V92 C 370 80, 382 80, 382 92 V180" />
        <path d="M14 80 V68 M376 80 V68" />
        {/* terrace + steps */}
        <path d="M0 180 H390 M10 188 H380 M24 196 H366" />
        {fountain(80)}
        {fountain(310)}
        <path d="M0 226 H390" opacity="0.5" />
      </g>
    </svg>
  );
}
