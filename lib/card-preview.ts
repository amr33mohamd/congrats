/**
 * What a shared card's link preview says (WhatsApp, Messenger, iMessage…):
 * the page title and description, and the text and colours of the preview
 * image. Everything comes from the card itself — the couple's names, the line
 * under them, the date, the first photo — so the guest sees whose card it is
 * before opening it.
 */
import { applyTokens, slotValue, type BoundExperience, type BoundMedia } from '@/lib/template-contract';

export interface CardPreview {
  locale: 'ar' | 'en';
  isInvitation: boolean;
  /** Small line above the names ("دعوة فرح", "لـ سارة"). */
  kicker: string;
  /** The names / main heading of the cover. */
  headline: string;
  /** The cover's second line, if any. */
  subline: string;
  /** The event date, formatted for the card's language ('' when none). */
  date: string;
  /** First photo on the card (videos are skipped). */
  photo: BoundMedia | null;
  colors: { ground: string; groundDeep: string; ink: string; accent: string; body: string };
  /** For <title> and og:title. */
  title: string;
  /** For og:description. */
  description: string;
}

/** The occasion, by template category, in the card's language. */
const OCCASIONS: Record<string, { ar: string; en: string }> = {
  invitation: { ar: 'دعوة فرح', en: 'Wedding invitation' },
  wedding: { ar: 'تهنئة بالجواز', en: 'Wedding congratulations' },
  proposal: { ar: 'طلب جواز', en: 'A proposal' },
  anniversary: { ar: 'ذكرى جوازنا', en: 'Anniversary card' },
  valentine: { ar: 'كارت حب', en: 'Love card' },
  birthday: { ar: 'تهنئة عيد ميلاد', en: 'Birthday card' },
  newborn: { ar: 'تهنئة بالمولود', en: 'New baby card' },
  graduation: { ar: 'تهنئة بالتخرّج', en: 'Graduation card' },
  eid: { ar: 'تهنئة بالعيد', en: 'Eid greetings' },
};

const HEX = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;
const hex = (c: string | undefined, fallback: string) => (c && HEX.test(c) ? c : fallback);

function formatDate(raw: string, locale: 'ar' | 'en'): string {
  if (!raw?.trim()) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  // A bare date is UTC midnight; read it back in UTC or it shows the day before.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw.trim());
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: dateOnly ? 'UTC' : 'Africa/Cairo',
  }).format(d);
}

export function cardPreview(exp: BoundExperience): CardPreview {
  const locale = exp.locale === 'ar' ? 'ar' : 'en';
  const fields = exp.fields ?? {};
  const steps = [...exp.steps].sort((a, b) => a.orderIndex - b.orderIndex);
  const sceneById = new Map(exp.scenes.map((s) => [s.id, s]));
  const isInvitation = exp.scenes.some((s) => s.type === 'Rsvp' || s.type === 'Families');

  // The cover: the first section that is shown and has text.
  let headline = '';
  let subline = '';
  let coverHeading: string | undefined;
  for (const step of steps) {
    const scene = sceneById.get(step.templateStepId);
    if (!scene || step.animationConfig?.hidden === true) continue;
    const texts = scene.slots
      .filter((s) => s.type === 'text')
      .map((s) => applyTokens(slotValue(scene, step, s.key, fields), exp.recipientName, fields).trim())
      .filter(Boolean);
    if (texts.length === 0) continue;
    headline = texts[0];
    subline = texts[1] ?? '';
    coverHeading = scene.style?.headingColor;
    break;
  }
  if (isInvitation && fields.couple?.trim()) headline = fields.couple.trim();

  const dateKey = Object.keys(fields).find((k) => /date/i.test(k) && fields[k]);
  const date = dateKey ? formatDate(fields[dateKey], locale) : '';

  let photo: BoundMedia | null = null;
  for (const step of steps) {
    if (step.animationConfig?.hidden === true) continue;
    const m = step.media.find((x) => !x.video && x.url);
    if (m) {
      photo = m;
      break;
    }
  }

  const palette = exp.theme.palette ?? [];
  const gradient = exp.theme.background?.type === 'gradient' ? exp.theme.background.colors ?? [] : [];
  const ground = hex(gradient[0] ?? palette[0], '#1A1418');
  const groundDeep = hex(gradient[1] ?? palette[1], ground);
  const accent = hex(exp.theme.accent ?? palette[3], '#D6A435');
  const body = hex(exp.theme.textColor, '#FFFFFF');
  const ink = hex(coverHeading, accent);

  const ar = locale === 'ar';
  const recipient = exp.recipientName?.trim();
  const named = OCCASIONS[exp.occasion ?? (isInvitation ? 'invitation' : '')];
  const occasion = named ? named[locale] : ar ? 'كارت تهنئة' : 'Greeting card';
  // "دعوة فرح · لـ سارة" — the occasion first, then who it is for.
  const kicker = recipient ? `${occasion} · ${ar ? `لـ ${recipient}` : `for ${recipient}`}` : occasion;

  // "دعوة فرح عبد الرحمن & سمية" / "Birthday card · Happy birthday Sara".
  const title = !headline
    ? kicker
    : isInvitation
      ? ar
        ? `${occasion} ${headline}`
        : `${occasion}: ${headline}`
      : `${occasion} · ${headline}`;
  const opener = ar ? 'افتح الكارت 💌' : 'Open the card 💌';
  const description = [subline, date, opener].filter(Boolean).join(' · ');

  return {
    locale,
    isInvitation,
    kicker,
    headline: headline || (ar ? 'Congrats' : 'Congrats'),
    subline,
    date,
    photo,
    colors: { ground, groundDeep, ink, accent, body },
    title,
    description,
  };
}

/** Changes whenever the preview would: share apps cache an image per URL. */
export function previewVersion(p: CardPreview): string {
  const key = [p.kicker, p.headline, p.subline, p.date, p.photo?.url.split('?')[0] ?? '', JSON.stringify(p.colors)].join('|');
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
