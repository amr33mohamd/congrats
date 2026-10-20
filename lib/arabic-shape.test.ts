import { describe, expect, it } from 'vitest';
import { shapeArabic, visualRtl, rtlLine, wrapWords, isArabic } from './arabic-shape';

const cps = (s: string) => Array.from(s).map((c) => c.codePointAt(0)!.toString(16));

describe('shapeArabic', () => {
  it('picks initial / medial / final forms', () => {
    // سمية: seen initial, meem medial, yeh medial, teh marbuta final
    expect(cps(shapeArabic('سمية'))).toEqual(['feb3', 'fee4', 'fef4', 'fe94']);
  });

  it('breaks the join after a letter that never joins forwards', () => {
    // دار: dal isolated, alef isolated (dal does not join on), reh isolated
    expect(cps(shapeArabic('دار'))).toEqual(['fea9', 'fe8d', 'fead']);
  });

  it('forms lam-alef ligatures', () => {
    expect(cps(shapeArabic('لا'))).toEqual(['fefb']);
    // سلام: seen initial, lam-alef final, meem isolated
    expect(cps(shapeArabic('سلام'))).toEqual(['feb3', 'fefc', 'fee1']);
  });

  it('lets marks ride along without breaking joins', () => {
    expect(cps(shapeArabic('بَب'))).toEqual(['fe91', '64e', 'fe90']);
  });

  it('leaves non-Arabic text alone', () => {
    expect(shapeArabic('Sara & Omar')).toBe('Sara & Omar');
  });
});

describe('visual order', () => {
  it('reverses Arabic but keeps numbers and Latin forwards', () => {
    expect(visualRtl('يوم 20 ديسمبر')).toBe('ربمسيد 20 موي');
    expect(visualRtl('حفلة Ahmed')).toBe('Ahmed ةلفح');
    expect(visualRtl('(سارة)')).toBe('(ةراس)');
    expect(visualRtl('٢٠/١٢/٢٠٢٦')).toBe('٢٠/١٢/٢٠٢٦');
  });

  it('rtlLine only touches Arabic lines', () => {
    expect(rtlLine('Sara & Omar')).toBe('Sara & Omar');
    expect(rtlLine('لا')).toBe('ﻻ');
    expect(isArabic('عبد الرحمن & سمية')).toBe(true);
  });
});

describe('wrapWords', () => {
  it('wraps by words, keeps typed breaks, and caps the line count', () => {
    expect(wrapWords('عبد الرحمن & سمية', 12, 3)).toEqual(['عبد الرحمن &', 'سمية']);
    expect(wrapWords('a\nb', 10, 3)).toEqual(['a', 'b']);
    expect(wrapWords('one two three four', 4, 2)).toEqual(['one', 'two…']);
  });
});
