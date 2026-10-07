import { describe, expect, it } from 'vitest';
import { templateBySlug } from '@/content/templates';
import { applyTokens, slotValue } from '@/lib/template-contract';
import { buildQuizPreview, personalize } from './personalize';
import { decodePrefill, encodePrefill, parseAnswers, type QuizAnswers } from './answers';

const def = (slug: string) => templateBySlug(slug)!.definition;

describe('personalize', () => {
  it('puts the couple, date and venue into a wedding invitation', () => {
    const p = personalize(
      def('invitation-qasr-gold-ar'),
      { occasion: 'wedding', name1: 'أحمد', name2: 'منى', date: '2027-05-20', venue: 'قاعة الماسة' },
      'ar',
    );
    expect(p.fields.couple).toBe('أحمد & منى');
    expect(p.fields.weddingDate).toBe('2027-05-20T19:00');
    expect(p.text.ceremony.venue).toBe('قاعة الماسة');
    expect(p.text.reception.venue).toBe('قاعة الماسة');
    expect(p.text.venue.address).toBe('قاعة الماسة');
    // The guest is still the reader of an invitation, not the couple.
    expect(p.recipientName).toBeUndefined();
    expect(p.hidden).toEqual([]);
  });

  it('retitles an invitation for an engagement and drops the contract section', () => {
    const p = personalize(def('invitation-ivory-arch-ar'), { occasion: 'engagement', name1: 'أحمد', name2: 'منى' }, 'ar');
    expect(p.text.reception.label).toBe('حفل الخطوبة');
    expect(p.hidden).toEqual(['ceremony']);
  });

  it('addresses a greeting card to the named person and fills its party date', () => {
    const p = personalize(def('birthday-kol-sana-ar'), { occasion: 'birthday', name1: 'نور', date: '2027-01-02', venue: 'البيت' }, 'ar');
    expect(p.recipientName).toBe('نور');
    expect(p.fields.partyDate).toBe('2027-01-02T19:00');
    expect(p.text.party.venue).toBe('البيت');
  });

  it("never touches a newborn's birth date", () => {
    const p = personalize(def('newborn-mabrouk-elmawloud-ar'), { occasion: 'newborn', name1: 'ليلى', date: '2027-03-01' }, 'ar');
    expect(p.text.tafaseel).toBeUndefined();
    expect(p.text.sebou.date).toBe('2027-03-01T19:00');
  });

  it("joins a couple's names as the recipient of a congratulation card", () => {
    const p = personalize(def('wedding-mabrouk-elzawag-ar'), { occasion: 'congrats', name1: 'أحمد', name2: 'منى' }, 'ar');
    expect(p.recipientName).toBe('أحمد ومنى');
  });

  it('caps values at the slot maxLen', () => {
    const d = def('invitation-qasr-gold-ar');
    const p = personalize(d, { occasion: 'wedding', venue: 'x'.repeat(60) }, 'ar');
    const max = d.scenes.find((s) => s.id === 'ceremony')!.slots.find((s) => s.key === 'venue')!.maxLen!;
    expect(p.text.ceremony.venue.length).toBeLessThanOrEqual(max);
  });
});

describe('buildQuizPreview', () => {
  it('shows the typed names on the cover', () => {
    const exp = buildQuizPreview(def('invitation-tarab-velvet-ar'), { occasion: 'wedding', name1: 'أحمد', name2: 'منى', lang: 'ar' }, {
      templateId: 't1',
      sampleGuest: 'أستاذ محمد',
    });
    const cover = exp.scenes.find((s) => s.id === 'cover')!;
    const step = exp.steps.find((s) => s.templateStepId === 'cover')!;
    expect(slotValue(cover, step, 'heading', exp.fields)).toBe('أحمد & منى');
    expect(exp.recipientName).toBe('أستاذ محمد');
  });

  it('reads an English design in Arabic when Arabic was picked', () => {
    const exp = buildQuizPreview(def('birthday-make-a-wish-en'), { occasion: 'birthday', name1: 'نور', lang: 'ar' }, {
      templateId: 't2',
      sampleGuest: 'x',
    });
    expect(exp.locale).toBe('ar');
    expect(exp.direction).toBe('rtl');
    const cover = exp.steps.find((s) => s.templateStepId === exp.scenes[0].id)!;
    expect(applyTokens(Object.values(cover.text).join(' '), exp.recipientName)).toContain('نور');
  });

  it('hides the contract section in an engagement preview', () => {
    const exp = buildQuizPreview(def('invitation-ivory-arch-en'), { occasion: 'engagement', lang: 'en' }, { templateId: 't3', sampleGuest: 'x' });
    expect(exp.steps.find((s) => s.templateStepId === 'ceremony')!.animationConfig.hidden).toBe(true);
  });
});

describe('answers', () => {
  it('round-trips through the prefill URL value, Arabic included', () => {
    const a: QuizAnswers = { occasion: 'henna', style: 'tarab', colors: ['gold'], name1: 'أحمد', name2: 'منى', date: '2027-02-14', venue: 'قاعة الماسة', lang: 'ar' };
    const encoded = encodePrefill(a);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodePrefill(encoded)).toEqual(a);
  });

  it('rejects malformed or oversized prefill values', () => {
    expect(decodePrefill(null)).toBeNull();
    expect(decodePrefill('not base64!')).toBeNull();
    expect(decodePrefill('a'.repeat(2000))).toBeNull();
    expect(decodePrefill(encodePrefill({ occasion: 'eid' }).slice(0, -3) + 'zzz')).toBeNull();
    expect(parseAnswers({ occasion: 'funeral' })).toBeNull();
    expect(parseAnswers({ occasion: 'eid', date: '2027-02-30' })).toBeNull();
    expect(parseAnswers({ occasion: 'eid', colors: ['gold', 'pink', 'navy'] })).toBeNull();
  });

  it('strips token braces and markup and caps the names', () => {
    const a = parseAnswers({ occasion: 'birthday', name1: '  {recipient}<b>نور</b>' + 'ي'.repeat(40) });
    expect(a?.name1).not.toMatch(/[{}<>]/);
    expect(a!.name1!.length).toBeLessThanOrEqual(20);
  });
});
