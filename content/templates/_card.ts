/**
 * Authoring kit for the one-page greeting cards.
 *
 * Every non-invitation template is read as ONE designed card, top to bottom:
 * cover → a personal letter → photos → the occasion's own sections → finale.
 * These helpers keep the sixteen of them consistent in the places that are
 * easy to get wrong by hand:
 *
 *  - every text/date field carries a builder label in both languages (a field
 *    without one shows up in the editor as a bare "Text", which is unusable on
 *    a card with twenty of them);
 *  - photo fields are always optional — the Player leaves an empty photo
 *    section out, so a card is publishable before any upload;
 *  - date fields ship WITHOUT a default: a fixed date goes stale, and every new
 *    card would count down to a day already gone. The sender picks the date;
 *    the gallery preview supplies a sample one (lib/template-preview.ts);
 *  - ornaments frame the two tall ends of the card only. Mid-card sections set
 *    `ornament: none` and open with a small flourish instead — a full arch
 *    squeezed around a four-line block reads as clutter, not architecture.
 */
import type {
  AnimationPreset,
  OrnamentKind,
  TemplateDefinitionInput,
} from '@/lib/template-contract';

export type Loc = 'ar' | 'en';
export type SceneInput = TemplateDefinitionInput['scenes'][number];
type SlotInput = NonNullable<SceneInput['slots']>[number];
type ThemeInput = NonNullable<TemplateDefinitionInput['theme']>;
/** Authoring shape of an ambient layer (intensity optional). */
export type Decoration = NonNullable<SceneInput['decoration']>;

/** [English label, Arabic label] shown next to the field in the builder. */
export type Label = readonly [en: string, ar: string];

/** Labels shared by every card, so the builder speaks one vocabulary. */
export const LABEL = {
  coverHeading: ['Main heading', 'العنوان الرئيسي'],
  coverSub: ['Line under the heading', 'السطر اللي تحت العنوان'],
  coverPhoto: ['Cover photo (optional)', 'صورة الغلاف (اختياري)'],
  letterOpening: ['Letter opening', 'أول الرسالة'],
  letterBody: ['Your letter', 'نص الرسالة'],
  letterSign: ['Signed', 'الإمضاء'],
  photo: ['Photo', 'الصورة'],
  caption: ['Caption', 'تعليق على الصورة'],
  galleryTitle: ['Gallery title', 'عنوان الصور'],
  gallery: ['Gallery photos (up to 6)', 'صور المعرض (لحد ٦)'],
  quote: ['Quote', 'الجملة'],
  quoteBy: ['Signed / source', 'الإمضاء أو المصدر'],
  line1: ['First line', 'السطر الأول'],
  line2: ['Second line', 'السطر التاني'],
  line3: ['Third line', 'السطر التالت'],
  countdownTitle: ['Countdown title', 'عنوان العدّ التنازلي'],
  countdownDate: ['Counts down to', 'العدّ لحد يوم'],
  countdownNote: ['Line under the countdown', 'سطر تحت العدّ'],
  eventName: ['Event name', 'اسم المناسبة'],
  eventPlace: ['Place', 'المكان'],
  eventWhen: ['Day & time', 'اليوم والساعة'],
  eventDate: ['Date', 'التاريخ'],
  venueTitle: ['Section title', 'عنوان القسم'],
  venueAddress: ['Address', 'العنوان بالتفصيل'],
  venueMap: ['Google Maps link (optional)', 'رابط جوجل ماب (اختياري)'],
  giftTitle: ['Gift title', 'عنوان الهدية'],
  giftNote: ['Gift note', 'كلمة مع الهدية'],
  giftPhoto: ['Photo of the gift (optional)', 'صورة الهدية (اختياري)'],
  finaleHeading: ['Closing line', 'جملة الختام'],
  finaleBody: ['Last words', 'آخر كلمة'],
} as const satisfies Record<string, Label>;

/**
 * A text field with its default in the card's own language. `{recipient}` in
 * the value is resolved at render time, so a renamed recipient flows through.
 */
export function text(
  loc: Loc,
  key: string,
  label: Label,
  value: string,
  opts: { required?: boolean; maxLen?: number; animation?: AnimationPreset } = {},
): SlotInput {
  return {
    key,
    type: 'text',
    editable: true,
    required: opts.required ?? false,
    maxLen: opts.maxLen ?? 60,
    labelEn: label[0],
    labelAr: label[1],
    ...(loc === 'ar' ? { defaultAr: value } : { defaultEn: value }),
    ...(opts.animation ? { animation: opts.animation } : {}),
  };
}

/** A date field. No default on purpose — see the file header. */
export function date(key: string, label: Label): SlotInput {
  return { key, type: 'date', editable: true, required: false, labelEn: label[0], labelAr: label[1] };
}

/** An optional photo (or gallery, with `max` > 1). */
export function photo(key: string, label: Label, opts: { aspect?: string; max?: number } = {}): SlotInput {
  return {
    key,
    type: 'image',
    editable: true,
    required: false,
    min: 0,
    max: opts.max ?? 1,
    aspect: opts.aspect ?? '3:4',
    labelEn: label[0],
    labelAr: label[1],
  };
}

export const enter = (preset: AnimationPreset, durationMs = 900) => ({ preset, durationMs, delayMs: 0 });

/** Mid-card sections carry no ornament of their own (see the file header). */
export const PLAIN = { kind: 'none' } as const;

/* ─────────────────────────────── the look ─────────────────────────────── */

export interface Look {
  /** [ground, ground-deep, paper, accent] — the gate and letter read these. */
  palette: readonly [string, string, string, string];
  accent: string;
  /** Body ink on the ground. */
  ink: string;
  /** Display headings on the ground. */
  headingInk: string;
  fontHeading: string;
  fontBody: string;
  music: string;
  /** The frame drawn around the cover and the finale. */
  ornament: OrnamentKind;
  pattern?: 'dots' | 'confettiDots' | 'noise' | 'damask' | 'diagonal';
  /** Gradient stops of the continuous ground (defaults to palette[0..1]). */
  ground?: readonly string[];
  /** Gradient angle of the continuous ground. */
  angle?: number;
  /** Ambient layer for the whole card (low, or it fights the words). */
  ambient?: Decoration;
}

export function theme(look: Look): ThemeInput {
  const [ground, deep] = look.palette;
  return {
    palette: [...look.palette],
    fontHeading: look.fontHeading,
    fontBody: look.fontBody,
    accent: look.accent,
    music: look.music,
    textColor: look.ink,
    ornament: { kind: look.ornament, opacity: 0.55, scale: 1 },
    background: {
      type: 'gradient',
      colors: look.ground ? [...look.ground] : [ground, deep],
      angle: look.angle ?? 170,
      ...(look.pattern ? { pattern: look.pattern } : {}),
    },
    ...(look.ambient ? { decoration: look.ambient } : {}),
  };
}

/** The cover/finale frame at full presence. */
export function frame(look: Look, opacity = 0.8) {
  return { kind: look.ornament, opacity, scale: 1 };
}
