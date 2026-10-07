import { OCCASIONS, type Occasion } from './answers';

/**
 * Ways into the questionnaire. The quiz runs on /start (ad landing page) and
 * embedded on the home page; occasion galleries and product pages deep-link
 * into /start with the occasion already picked.
 *
 * `source` is the only prop `quiz_start` carries besides option keys — it says
 * which surface the visitor came from, never anything they typed.
 */

export const QUIZ_SOURCES = ['home', 'start', 'occasion', 'product'] as const;
export type QuizSource = (typeof QUIZ_SOURCES)[number];

/** Gallery category (/templates/<category>) → the quiz occasion it serves. */
export const CATEGORY_OCCASION: Record<string, Occasion> = {
  anniversary: 'anniversary',
  valentine: 'valentine',
  proposal: 'proposal',
  birthday: 'birthday',
  eid: 'eid',
  graduation: 'graduation',
  newborn: 'newborn',
  // The "wedding" category holds congratulation cards for a couple.
  wedding: 'congrats',
  invitation: 'wedding',
};

/** Product landing page slug → quiz occasion. Products with no quiz fit are left out. */
export const PRODUCT_OCCASION: Record<string, Occasion> = {
  'love-story': 'anniversary',
  'digital-eidiya': 'eid',
  'katb-ketab-invitation': 'wedding',
  'wedding-full-package': 'wedding',
  'sebou-baby-announcement': 'newborn',
  graduation: 'graduation',
  'birthday-surprise': 'birthday',
};

/** A query-string value as an occasion key, or undefined if it isn't one. */
export function parseOccasion(v: unknown): Occasion | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === 'string' && (OCCASIONS as readonly string[]).includes(s) ? (s as Occasion) : undefined;
}

/** `?from=` on /start: only the deep-link sources are accepted; anything else is a direct visit. */
export function parseStartSource(v: unknown): QuizSource {
  const s = Array.isArray(v) ? v[0] : v;
  return s === 'occasion' || s === 'product' ? s : 'start';
}

/** Locale-less path to /start with the occasion preselected (pass to the i18n Link). */
export function quizHref(occasion: Occasion, from: 'occasion' | 'product'): string {
  return `/start?occasion=${occasion}&from=${from}`;
}
