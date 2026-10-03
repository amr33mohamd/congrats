/**
 * Nearest known slug to a mistyped one, so a link with a typo
 * (/templates/invitaton, /t/birthday-kol-saa-ar) lands on the page it meant
 * instead of a 404. Links get shared in chats and auto-replies where one
 * dropped letter is easy to miss.
 *
 * Returns null when nothing is close enough — callers then fall back to the
 * gallery rather than guessing.
 */
export function closestSlug(input: string, known: readonly string[], maxDistance = 3): string | null {
  const s = input.toLowerCase().slice(0, 120);
  let best: string | null = null;
  let bestDist = Infinity;
  for (const k of known) {
    const d = distance(s, k);
    if (d < bestDist) {
      best = k;
      bestDist = d;
    }
  }
  return bestDist <= maxDistance ? best : null;
}

/** Levenshtein distance, two-row DP. */
function distance(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}
