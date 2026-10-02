/**
 * Web-font loading for template themes. Templates name display fonts
 * ("Playfair Display", "Dancing Script", "Cairo", …). We load them on demand
 * from Google Fonts and expose a CSS font-family string with sensible fallbacks.
 *
 * Consistent with the project's "external assets" choice: fonts stream from the
 * Google Fonts CDN at runtime. Inter / Cairo / Tajawal are already bundled via
 * next/font, but re-requesting them here is harmless.
 */

/** Curated set of supported families → requested weights. Latin + Arabic display faces. */
const FONT_WEIGHTS: Record<string, string> = {
  // Latin — sans / rounded
  Inter: '400;500;600;700;800',
  Poppins: '400;500;600;700;800',
  Montserrat: '400;500;600;700;800',
  Quicksand: '400;500;600;700',
  Fredoka: '400;500;600;700',
  Nunito: '400;600;700;800',
  // Latin — serif / elegant
  'Playfair Display': '400;500;600;700;800',
  'Cormorant Garamond': '400;500;600;700',
  Marcellus: '400',
  'Abril Fatface': '400',
  Lora: '400;500;600;700',
  'DM Serif Display': '400',
  // Latin — script / handwritten
  'Dancing Script': '400;500;600;700',
  'Great Vibes': '400',
  Pacifico: '400',
  Sacramento: '400',
  Caveat: '400;500;600;700',
  Parisienne: '400',
  // Latin — display / bold
  'Bebas Neue': '400',
  Cinzel: '400;500;600;700',
  // Arabic
  Cairo: '400;500;600;700;800',
  Tajawal: '400;500;700',
  'Reem Kufi': '400;500;600;700',
  Amiri: '400;700',
  'Aref Ruqaa': '400;700',
  'El Messiri': '400;500;600;700',
  Lalezar: '400',
  Lateef: '400;700',
  'Markazi Text': '400;500;600;700',
  Mada: '400;500;700',
  Harmattan: '400;700',
};

const SYSTEM_FALLBACK = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
const SERIF_HINTS = ['Cinzel', 'Playfair', 'Cormorant', 'Marcellus', 'Abril', 'Lora', 'DM Serif', 'Amiri', 'Aref', 'Markazi'];

/** Build a CSS font-family value with a type-appropriate fallback. */
export function cssFamily(name?: string): string {
  if (!name) return `var(--font-heading), ${SYSTEM_FALLBACK}`;
  const isSerif = SERIF_HINTS.some((h) => name.includes(h));
  const fallback = isSerif ? 'Georgia, serif' : SYSTEM_FALLBACK;
  return `'${name}', ${fallback}`;
}

/**
 * CSS font-family for a card's running text. The template's own body face
 * leads (it is loaded with the display faces), then the app's bundled body
 * font, so a slow or blocked font CDN degrades to our own type rather than
 * the OS default.
 */
export function bodyFamily(name?: string): string {
  if (!name || !isKnownFont(name)) return `var(--font-body), ${SYSTEM_FALLBACK}`;
  return `'${name}', var(--font-body), ${SYSTEM_FALLBACK}`;
}

/** Known family? (so we only request fonts Google can actually serve from our list). */
export function isKnownFont(name?: string): boolean {
  return Boolean(name && name in FONT_WEIGHTS);
}

/**
 * Build a single Google Fonts CSS2 href for the given families (deduped).
 * Returns null when none are loadable.
 */
export function googleFontsHref(families: Array<string | undefined>): string | null {
  const unique = Array.from(
    new Set(families.filter((f): f is string => isKnownFont(f))),
  );
  if (unique.length === 0) return null;
  const parts = unique.map((fam) => {
    const weights = FONT_WEIGHTS[fam] ?? '400;700';
    return `family=${encodeURIComponent(fam)}:wght@${weights}`;
  });
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`;
}
