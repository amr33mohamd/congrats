import type { BoundExperience, Locale, TemplateDefinition } from '@/lib/template-contract';
import { buildPreviewExperience } from '@/lib/template-preview';
import { OCCASION_INFO, cleanText, joinedNames, type QuizAnswers } from './answers';

/**
 * Quiz answers → the values a card is created with.
 *
 * One function feeds both the live preview on /start and the real card the
 * builder creates from `?prefill=`, so what the visitor saw is what they get.
 * It only ever writes slots the template already declares as editable, and
 * caps every value at that slot's own maxLen.
 *
 *  - names   → the `couple` field on an invitation, else the recipient
 *              ({recipient} in the card's copy is the person it's for);
 *  - date    → every card-level date field, plus unbound date slots on
 *              event/countdown sections (never a newborn's birth date);
 *  - venue   → `venue` slots on event sections and the address section;
 *  - engagement / henna → an invitation retitled for that night, with the
 *              marriage-contract section switched off.
 */

export interface Personalization {
  /** Only set when the card addresses the person the answers name. */
  recipientName?: string;
  /** Card-level field values (TemplateDefinition.fields). */
  fields: Record<string, string>;
  /** Slot values per scene id. */
  text: Record<string, Record<string, string>>;
  /** Scene ids to switch off (stored as animationConfig.hidden). */
  hidden: string[];
}

/** Event night default; the builder's date inputs are datetime-local. */
const EVENING = 'T19:00';

const NIGHT_COPY: Record<'engagement' | 'henna', Record<Locale, { label: string; sub: string; countdown: string }>> = {
  engagement: {
    ar: { label: 'حفل الخطوبة', sub: 'يتشرّفان بدعوتكم لحفل خطوبتهما', countdown: 'باقي على الخطوبة' },
    en: { label: 'The Engagement Party', sub: 'are getting engaged', countdown: 'Counting down' },
  },
  henna: {
    ar: { label: 'ليلة الحنة', sub: 'يتشرّفان بدعوتكم لليلة الحنة', countdown: 'باقي على الحنة' },
    en: { label: 'The Henna Night', sub: 'invite you to their henna night', countdown: 'Counting down' },
  },
};

function cap(value: string, maxLen: number | undefined): string {
  return maxLen ? cleanText(value, maxLen) : value;
}

export function personalize(
  def: Pick<TemplateDefinition, 'fields' | 'scenes'>,
  answers: QuizAnswers,
  locale: Locale,
): Personalization {
  const out: Personalization = { fields: {}, text: {}, hidden: [] };
  const info = OCCASION_INFO[answers.occasion];
  const set = (sceneId: string, key: string, value: string) => {
    (out.text[sceneId] ??= {})[key] = value;
  };

  /* names */
  const coupleField = (def.fields ?? []).find((f) => f.key === 'couple' && f.type === 'text');
  if (coupleField) {
    const names = joinedNames(answers);
    if (names) out.fields.couple = cap(names, coupleField.maxLen);
  } else {
    const names =
      info.names === 'couple'
        ? joinedNames(answers, locale === 'ar' ? ' و' : ' & ')
        : (answers.name1 ?? '');
    if (names.trim()) out.recipientName = cleanText(names, 120);
  }

  /* date */
  if (answers.date) {
    const when = `${answers.date}${EVENING}`;
    for (const f of def.fields ?? []) if (f.type === 'date') out.fields[f.key] = when;
    for (const scene of def.scenes) {
      if (scene.type !== 'Event' && scene.type !== 'Countdown') continue;
      for (const slot of scene.slots) {
        if (slot.type === 'date' && !slot.bind && slot.editable !== false) set(scene.id, slot.key, when);
      }
    }
  }

  /* venue */
  if (answers.venue) {
    for (const scene of def.scenes) {
      const key = scene.type === 'Event' ? 'venue' : scene.type === 'Venue' ? 'address' : null;
      if (!key) continue;
      const slot = scene.slots.find((s) => s.key === key && s.type === 'text' && !s.bind && s.editable !== false);
      if (slot) set(scene.id, key, cap(answers.venue, slot.maxLen));
    }
  }

  /* engagement / henna nights on a wedding invitation */
  if (info.invitation && (answers.occasion === 'engagement' || answers.occasion === 'henna')) {
    const copy = NIGHT_COPY[answers.occasion][locale];
    const scene = (id: string) => def.scenes.find((s) => s.id === id);
    const editable = (id: string, key: string) =>
      scene(id)?.slots.find((s) => s.key === key && s.type === 'text' && !s.bind && s.editable !== false);
    const reception = editable('reception', 'label');
    if (reception) set('reception', 'label', cap(copy.label, reception.maxLen));
    const sub = editable('cover', 'subheading');
    if (sub) set('cover', 'subheading', cap(copy.sub, sub.maxLen));
    const countdown = editable('countdown', 'heading');
    if (countdown) set('countdown', 'heading', cap(copy.countdown, countdown.maxLen));
    if (scene('ceremony') && reception) out.hidden.push('ceremony');
  }

  return out;
}

/** The template, read in `locale` (its slots carry both languages' defaults). */
export function inLocale(def: TemplateDefinition, locale: Locale): TemplateDefinition {
  if (def.locale === locale) return def;
  return { ...def, locale, direction: locale === 'ar' ? 'rtl' : 'ltr' };
}

/**
 * The gallery preview of a template, personalised with the quiz answers and
 * read in the language the visitor picked.
 */
export function buildQuizPreview(
  def: TemplateDefinition,
  answers: QuizAnswers,
  opts: { templateId: string; category?: string; sampleGuest: string },
): BoundExperience {
  const locale = answers.lang ?? def.locale;
  const local = inLocale(def, locale);
  const base = buildPreviewExperience(local, {
    templateId: opts.templateId,
    category: opts.category,
    recipientName: opts.sampleGuest,
  });
  const p = personalize(local, answers, locale);
  return {
    ...base,
    recipientName: p.recipientName ?? opts.sampleGuest,
    fields: { ...base.fields, ...p.fields },
    steps: base.steps.map((step) => ({
      ...step,
      text: { ...step.text, ...(p.text[step.templateStepId] ?? {}) },
      animationConfig: p.hidden.includes(step.templateStepId)
        ? { ...step.animationConfig, hidden: true }
        : step.animationConfig,
    })),
  };
}
