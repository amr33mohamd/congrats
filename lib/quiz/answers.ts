import { z } from 'zod';
import type { CategorySlug } from '@/content/templates/_helpers';

/**
 * The /start questionnaire: what it asks and what each answer means.
 *
 * Shared by the quiz page (client), the matcher, the live preview and the
 * builder's `?prefill=` (server) so every side reads the same, validated shape.
 * Answers are free text only where the visitor types (names, venue) and those
 * are length-capped here, before they reach a template or the database.
 */

/* ─────────────────────────────── occasions ─────────────────────────────── */

export const OCCASIONS = [
  'wedding',
  'engagement',
  'henna',
  'birthday',
  'graduation',
  'newborn',
  'eid',
  'anniversary',
  'proposal',
  'valentine',
  'congrats',
] as const;
export type Occasion = (typeof OCCASIONS)[number];

export interface OccasionInfo {
  /** Catalog category the occasion is served by. */
  category: CategorySlug;
  /** Two names (the couple) or one (the person the card is for). */
  names: 'couple' | 'single';
  /** Sent BY the hosts (an invitation) rather than to someone (a card). */
  invitation: boolean;
  emoji: string;
}

export const OCCASION_INFO: Record<Occasion, OccasionInfo> = {
  wedding: { category: 'invitation', names: 'couple', invitation: true, emoji: '💍' },
  engagement: { category: 'invitation', names: 'couple', invitation: true, emoji: '💐' },
  henna: { category: 'invitation', names: 'couple', invitation: true, emoji: '🌿' },
  birthday: { category: 'birthday', names: 'single', invitation: false, emoji: '🎂' },
  graduation: { category: 'graduation', names: 'single', invitation: false, emoji: '🎓' },
  newborn: { category: 'newborn', names: 'single', invitation: false, emoji: '🍼' },
  eid: { category: 'eid', names: 'single', invitation: false, emoji: '🌙' },
  anniversary: { category: 'anniversary', names: 'single', invitation: false, emoji: '💞' },
  proposal: { category: 'proposal', names: 'single', invitation: false, emoji: '💌' },
  valentine: { category: 'valentine', names: 'single', invitation: false, emoji: '❤️' },
  congrats: { category: 'wedding', names: 'couple', invitation: false, emoji: '🥂' },
};

/* ──────────────────────────────── styles ───────────────────────────────── */

export const STYLES = ['classic-gold', 'luxe-noir', 'tarab', 'soft-nature', 'porcelain', 'joyful'] as const;
export type StyleKey = (typeof STYLES)[number];

/** Swatch shown on each style card: [ground, ink/second, accent]. */
export const STYLE_SWATCH: Record<StyleKey, readonly [string, string, string]> = {
  'classic-gold': ['#F6EEDC', '#101A2E', '#C9A24B'],
  'luxe-noir': ['#160408', '#2A0E1B', '#C9A227'],
  tarab: ['#F4E8D2', '#5C0E1B', '#A8782E'],
  'soft-nature': ['#F7F4EC', '#7C8A6B', '#A98E4F'],
  porcelain: ['#F6F4EF', '#1F3358', '#4A6FA5'],
  joyful: ['#7C3AED', '#0F766E', '#FBBF24'],
};

/* ──────────────────────────────── colours ──────────────────────────────── */

export const COLORS = ['gold', 'burgundy', 'navy', 'green', 'pink', 'ivory'] as const;
export type ColorKey = (typeof COLORS)[number];

export const COLOR_SWATCH: Record<ColorKey, string> = {
  gold: '#C9A24B',
  burgundy: '#7A1424',
  navy: '#1F3358',
  green: '#4F6B4A',
  pink: '#F4B6C2',
  ivory: '#F6EEDC',
};

export const MAX_COLORS = 2;

/* ──────────────────────────────── answers ──────────────────────────────── */

// Two names joined with " & " must fit the invitation's 44-character couple field.
export const NAME_MAX = 20;
export const VENUE_MAX = 60;

/** Collapse whitespace, drop control characters and braces (template tokens). */
export function cleanText(v: string, max: number): string {
  return v
    .replace(/[\u0000-\u001f\u007f{}<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim();
}

const text = (max: number) =>
  z
    .string()
    .max(max * 4)
    .transform((v) => cleanText(v, max));

/** A calendar day, YYYY-MM-DD, that actually exists. */
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(`${v}T12:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  });

export const QuizAnswersSchema = z.object({
  occasion: z.enum(OCCASIONS),
  style: z.enum(STYLES).optional(),
  colors: z.array(z.enum(COLORS)).max(MAX_COLORS).optional(),
  name1: text(NAME_MAX).optional(),
  name2: text(NAME_MAX).optional(),
  date: day.optional(),
  venue: text(VENUE_MAX).optional(),
  lang: z.enum(['ar', 'en']).optional(),
});
export type QuizAnswers = z.infer<typeof QuizAnswersSchema>;

/** Answers collected so far (the occasion may not be picked yet). */
export type PartialAnswers = Partial<QuizAnswers>;

export function parseAnswers(input: unknown): QuizAnswers | null {
  const r = QuizAnswersSchema.safeParse(input);
  return r.success ? r.data : null;
}

/** The names, joined the way the card shows them ("أحمد & منى"). */
export function joinedNames(a: Pick<QuizAnswers, 'occasion' | 'name1' | 'name2'>, sep = ' & '): string {
  const one = a.name1?.trim() ?? '';
  if (OCCASION_INFO[a.occasion].names === 'single') return one;
  const two = a.name2?.trim() ?? '';
  return [one, two].filter(Boolean).join(sep);
}

/* ───────────────────────────── URL round trip ──────────────────────────── */

/** The prefill travels inside `next=`; anything longer than this is refused. */
export const PREFILL_MAX = 800;

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Compact, URL-safe encoding of the answers for `/builder?prefill=`. */
export function encodePrefill(a: QuizAnswers): string {
  const compact: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(a)) {
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    compact[k] = v;
  }
  return toBase64Url(JSON.stringify(compact));
}

/** Decode and validate a `?prefill=` value. Null for anything malformed. */
export function decodePrefill(raw: string | null | undefined): QuizAnswers | null {
  if (!raw || raw.length > PREFILL_MAX || !/^[A-Za-z0-9_-]+$/.test(raw)) return null;
  try {
    return parseAnswers(JSON.parse(fromBase64Url(raw)));
  } catch {
    return null;
  }
}
