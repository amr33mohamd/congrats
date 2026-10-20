import { describe, expect, it } from 'vitest';
import { darken, inkFor, isDarkSlot } from './color';
import { withDarkSlots, darkSlots, type LocalStep } from '@/components/dashboard/editor-state';

describe('darker text', () => {
  it('darkens hex colours and falls back to color-mix', () => {
    expect(darken('#FFFFFF')).toBe('#666666');
    expect(darken('#fff')).toBe('#666666');
    expect(darken('#C9A24B')).toBe('#50411e');
    expect(darken('rgb(10, 20, 30)')).toBe('color-mix(in srgb, rgb(10, 20, 30) 40%, #000)');
  });

  it('applies only to the fields switched to darker', () => {
    const step = { animationConfig: { darkText: ['body'] } };
    expect(isDarkSlot(step, 'body')).toBe(true);
    expect(isDarkSlot(step, 'heading')).toBe(false);
    expect(isDarkSlot({ animationConfig: {} }, 'body')).toBe(false);
    expect(inkFor(step, 'body', '#FFFFFF')).toBe('#666666');
    expect(inkFor(step, 'heading', '#FFFFFF')).toBe('#FFFFFF');
  });

  it('the editor switch adds and removes keys, keeping other settings', () => {
    const base: LocalStep = { templateStepId: 's', orderIndex: 0, text: {}, media: [], animationConfig: { hidden: false } };
    const on = withDarkSlots(base, ['body', 'heading'], true);
    expect(darkSlots(on).sort()).toEqual(['body', 'heading']);
    expect(on.animationConfig.hidden).toBe(false);
    const off = withDarkSlots(withDarkSlots(on, ['body'], false), ['heading'], false);
    expect(darkSlots(off)).toEqual([]);
    expect('darkText' in off.animationConfig).toBe(false);
  });
});
