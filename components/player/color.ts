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
