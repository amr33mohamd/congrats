import { describe, expect, it } from 'vitest';
import { cardPreview, previewVersion } from './card-preview';
import type { BoundExperience } from './template-contract';

const base = (over: Partial<BoundExperience>): BoundExperience =>
  ({
    experienceId: 'e',
    templateId: 't',
    locale: 'ar',
    direction: 'rtl',
    recipientName: '',
    fields: {},
    theme: { palette: ['#F6F4EF', '#E6EAF2', '#1F3358', '#4A6FA5'], accent: '#4A6FA5', textColor: '#1F3358' },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        style: { headingColor: '#1F3358' },
        slots: [
          { key: 'heading', type: 'text', bind: 'couple' },
          { key: 'subheading', type: 'text' },
        ],
      },
      { id: 'rsvp', type: 'Rsvp', slots: [] },
    ],
    steps: [
      { templateStepId: 'cover', orderIndex: 0, text: { subheading: 'يتشرّفان بدعوتكم' }, media: [], animationConfig: {} },
      { templateStepId: 'rsvp', orderIndex: 1, text: {}, media: [], animationConfig: {} },
    ],
    ...over,
  }) as unknown as BoundExperience;

describe('cardPreview', () => {
  it('names the occasion and the couple in the card language', () => {
    const p = cardPreview(base({ occasion: 'invitation', fields: { couple: 'عبد الرحمن & سمية', weddingDate: '2026-12-20' } }));
    expect(p.title).toBe('دعوة فرح عبد الرحمن & سمية');
    expect(p.kicker).toBe('دعوة فرح');
    expect(p.subline).toBe('يتشرّفان بدعوتكم');
    expect(p.date).toContain('٢٠٢٦');
    expect(p.description).toContain('يتشرّفان بدعوتكم');
    expect(p.colors.ink).toBe('#1F3358');
  });

  it('uses English for an English card and adds the recipient', () => {
    const p = cardPreview(base({ locale: 'en', occasion: 'birthday', recipientName: 'Sara', scenes: [base({}).scenes[0]], steps: [base({}).steps[0]] }));
    expect(p.kicker).toBe('Birthday card · for Sara');
    expect(p.title.startsWith('Birthday card · ')).toBe(true);
  });

  it('skips videos for the photo and changes version with the content', () => {
    const withMedia = base({
      occasion: 'invitation',
      steps: [
        { templateStepId: 'cover', orderIndex: 0, text: {}, media: [{ slot: 'image', url: '/v.mp4', video: true }, { slot: 'image', url: '/p.jpg?exp=1' }], animationConfig: {} },
      ],
    });
    const a = cardPreview(withMedia);
    expect(a.photo?.url).toBe('/p.jpg?exp=1');
    const b = cardPreview({ ...withMedia, fields: { couple: 'X & Y' } });
    expect(previewVersion(a)).not.toBe(previewVersion(b));
    // The signed-URL expiry alone must not change the version.
    const c = cardPreview({ ...withMedia, steps: [{ ...withMedia.steps[0], media: [{ slot: 'image', url: '/p.jpg?exp=2' }] }] });
    expect(previewVersion(c)).toBe(previewVersion(a));
  });
});
