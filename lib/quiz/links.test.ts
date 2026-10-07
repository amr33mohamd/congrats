import { describe, expect, it } from 'vitest';
import { OCCASIONS } from './answers';
import { CATEGORY_OCCASION, PRODUCT_OCCASION, parseOccasion, parseStartSource, quizHref } from './links';
import { CATALOG_CATEGORIES } from '@/content/templates/categories';
import { PRODUCTS } from '@/content/products';

describe('quiz deep links', () => {
  it('parses only known occasions', () => {
    expect(parseOccasion('birthday')).toBe('birthday');
    expect(parseOccasion(['eid', 'x'])).toBe('eid');
    expect(parseOccasion('nope')).toBeUndefined();
    expect(parseOccasion(undefined)).toBeUndefined();
    expect(parseOccasion('__proto__')).toBeUndefined();
  });

  it('accepts only deep-link sources from the URL', () => {
    expect(parseStartSource('occasion')).toBe('occasion');
    expect(parseStartSource('product')).toBe('product');
    expect(parseStartSource('home')).toBe('start');
    expect(parseStartSource(undefined)).toBe('start');
  });

  it('maps every catalog category to a real occasion', () => {
    for (const c of CATALOG_CATEGORIES) {
      expect(OCCASIONS).toContain(CATEGORY_OCCASION[c.slug]);
    }
  });

  it('maps only real products to real occasions', () => {
    const slugs = new Set(PRODUCTS.map((p) => p.slug));
    for (const [slug, occ] of Object.entries(PRODUCT_OCCASION)) {
      expect(slugs.has(slug)).toBe(true);
      expect(OCCASIONS).toContain(occ);
    }
  });

  it('builds the /start link', () => {
    expect(quizHref('birthday', 'occasion')).toBe('/start?occasion=birthday&from=occasion');
  });
});
