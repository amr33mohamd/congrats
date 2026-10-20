/**
 * Colour helpers for picking legible ink from a TEMPLATE's own palette.
 *
 * Everything a card paints must come from the template, never from app
 * tokens: `text-ink` is near-white in the dark product theme, which is how the
 * letter sheet and the open gate once rendered white-on-white.
 */

/** Relative luminance of a hex colour, 0 (black) → 1 (white). */
export function hexLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Pick the palette entry that reads best on `on` (or plain dark/light ink). */
export function readableOn(on: string, palette: string[]): string {
  const target = hexLuminance(on) > 0.5;
  const candidates = palette.filter((c) => /^#[0-9a-f]{3,8}$/i.test(c));
  let best = target ? '#1A1418' : '#FFFFFF';
  let bestGap = 0;
  for (const c of candidates) {
    const gap = Math.abs(hexLuminance(c) - hexLuminance(on));
    if (gap > bestGap) {
      bestGap = gap;
      best = c;
    }
  }
  return bestGap > 0.35 ? best : target ? '#1A1418' : '#FFFFFF';
}

/** How much of the original colour a "darker" text keeps (the rest is black). */
const DARKER_KEEP = 0.4;

/**
 * The darker shade of a text colour, for a field the sender switched to
 * "darker". Hex colours are mixed in JS (works in every browser); anything
 * else (rgb(), named) falls back to CSS color-mix.
 */
export function darken(color: string, keep = DARKER_KEEP): string {
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) {
    const h = color.slice(1);
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return (
      '#' +
      [0, 2, 4]
        .map((i) => Math.round(parseInt(n.slice(i, i + 2), 16) * keep).toString(16).padStart(2, '0'))
        .join('')
    );
  }
  return `color-mix(in srgb, ${color} ${Math.round(keep * 100)}%, #000)`;
}

/**
 * The text fields a sender switched to "darker" live on the step, as
 * `animationConfig.darkText: string[]` (slot keys), so they save with the
 * rest of the scene and need no schema change.
 */
export function isDarkSlot(step: { animationConfig?: Record<string, unknown> }, key: string): boolean {
  const list = step.animationConfig?.darkText;
  return Array.isArray(list) && list.includes(key);
}

/** `color`, or its darker shade when the sender switched that field to darker. */
export function inkFor(step: { animationConfig?: Record<string, unknown> }, key: string, color: string): string {
  return isDarkSlot(step, key) ? darken(color) : color;
}
