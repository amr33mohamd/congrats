import type { TemplateDefinition } from '@/lib/template-contract';
import {
  OCCASION_INFO,
  STYLES,
  type ColorKey,
  type PartialAnswers,
  type QuizAnswers,
  type StyleKey,
} from './answers';

/**
 * Quiz answers → the templates that fit them best.
 *
 * Templates are not hand-tagged: a template's style and colours are READ from
 * its own theme (and, for invitations, the style key in its slug), so a design
 * an admin adds later is matched without touching this file.
 */

export interface MatchCandidate {
  id: string;
  slug: string;
  locale: 'ar' | 'en';
  categorySlug: string | null;
  definition: Pick<TemplateDefinition, 'theme'>;
}

/* ─────────────────────────────── colour maths ──────────────────────────── */

interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): Hsl | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s, l };
}

/** The colour family a swatch reads as, or null for near-black/grey. */
export function colorFamily(hex: string): ColorKey | null {
  const c = hexToHsl(hex);
  if (!c) return null;
  const { h, s, l } = c;
  if (l >= 0.86 && s < 0.75) return 'ivory';
  if (l >= 0.78 && h >= 25 && h <= 60) return 'ivory';
  if (s < 0.12) return null;
  if (h >= 330 || h < 15) return l < 0.45 ? 'burgundy' : 'pink';
  if (h >= 15 && h < 65) return l < 0.22 ? 'burgundy' : 'gold';
  if (h >= 65 && h < 175) return 'green';
  if (h >= 175 && h < 265) return 'navy';
  return 'pink'; // purples read closest to the pink family
}

/** Every colour family a template's palette shows. */
export function templateColors(def: Pick<TemplateDefinition, 'theme'>): Set<ColorKey> {
  const swatches = [...(def.theme.palette ?? []), def.theme.accent ?? ''].filter(Boolean);
  const out = new Set<ColorKey>();
  for (const hex of swatches) {
    const f = colorFamily(hex);
    if (f) out.add(f);
  }
  return out;
}

/** Slug fragments of the named invitation art directions. */
const SLUG_STYLE: Array<[string, StyleKey]> = [
  ['ivory-arch', 'classic-gold'],
  ['qasr-gold', 'classic-gold'],
  ['baroque-noir', 'luxe-noir'],
  ['tarab-velvet', 'tarab'],
  ['sage-garden', 'soft-nature'],
  ['blue-porcelain', 'porcelain'],
];

/** The style a template reads as. */
export function templateStyle(t: Pick<MatchCandidate, 'slug' | 'definition'>): StyleKey {
  for (const [frag, style] of SLUG_STYLE) if (t.slug.includes(frag)) return style;
  for (const s of STYLES) if (t.slug.includes(s)) return s;

  const theme = t.definition.theme;
  if (theme.ornament?.kind === 'banner') return 'joyful';
  if (theme.ornament?.kind === 'theatre') return 'tarab';
  const ground = hexToHsl(theme.palette?.[0] ?? '');
  if (!ground) return 'classic-gold';
  if (ground.l >= 0.6) {
    const ink = hexToHsl(theme.palette?.[2] ?? '');
    return ink && ink.h >= 175 && ink.h < 265 && ink.s > 0.3 ? 'porcelain' : 'soft-nature';
  }
  if (ground.h >= 330 || ground.h < 15) return 'luxe-noir';
  return 'classic-gold';
}

/* ──────────────────────────────── scoring ──────────────────────────────── */

/** Categories close enough to stand in when the occasion has few designs. */
const RELATED: Record<string, string[]> = {
  invitation: ['wedding', 'proposal', 'anniversary'],
  wedding: ['invitation', 'anniversary'],
  anniversary: ['valentine', 'wedding'],
  valentine: ['anniversary', 'proposal'],
  proposal: ['valentine', 'anniversary'],
  birthday: ['graduation', 'newborn'],
  graduation: ['birthday'],
  newborn: ['birthday'],
  eid: ['birthday'],
};

export const SCORE = {
  category: 100,
  related: 40,
  language: 25,
  style: 20,
  color: 8,
} as const;

export function scoreTemplate(t: MatchCandidate, a: PartialAnswers): number {
  let score = 0;
  const wanted = a.occasion ? OCCASION_INFO[a.occasion].category : null;
  if (wanted && t.categorySlug === wanted) score += SCORE.category;
  else if (wanted && t.categorySlug && RELATED[wanted]?.includes(t.categorySlug)) score += SCORE.related;
  if (a.lang && t.locale === a.lang) score += SCORE.language;
  if (a.style && templateStyle(t) === a.style) score += SCORE.style;
  if (a.colors?.length) {
    const has = templateColors(t.definition);
    for (const c of a.colors) if (has.has(c)) score += SCORE.color;
  }
  return score;
}

/** The same design in another language shares its slug minus the -ar/-en. */
function designKey(slug: string): string {
  return slug.replace(/-(ar|en)$/, '');
}

export interface MatchResult<T extends MatchCandidate> {
  best: T;
  alternatives: T[];
}

/**
 * The best template plus up to `alternatives` others, each a DIFFERENT design
 * (an Arabic/English twin of one already picked is skipped — it would look
 * identical in the preview). Ties keep catalog order, so results are stable.
 */
export function matchTemplates<T extends MatchCandidate>(
  templates: readonly T[],
  answers: QuizAnswers | PartialAnswers,
  alternatives = 2,
): MatchResult<T> | null {
  if (templates.length === 0) return null;
  const ranked = templates
    .map((t, i) => ({ t, i, score: scoreTemplate(t, answers) }))
    .sort((x, y) => y.score - x.score || x.i - y.i);

  const picked: T[] = [];
  const designs = new Set<string>();
  for (const { t } of ranked) {
    const key = designKey(t.slug);
    if (designs.has(key)) continue;
    designs.add(key);
    picked.push(t);
    if (picked.length > alternatives) break;
  }
  return { best: picked[0], alternatives: picked.slice(1) };
}
