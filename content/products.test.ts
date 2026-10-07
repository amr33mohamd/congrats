import { describe, expect, it } from 'vitest';
import { PRODUCTS, ctaPath, productBySlug, startingPrice, whatsappHref, whatsappMessage, type L } from './products';
import { TEMPLATE_CATALOG, CATALOG_CATEGORIES } from './templates';
import arMessages from '@/messages/ar/products.json';
import enMessages from '@/messages/en/products.json';

const templateSlugs = new Set(TEMPLATE_CATALOG.map((t) => t.slug));
const categorySlugs = new Set<string>(CATALOG_CATEGORIES.map((c) => c.slug));

const filled = (l: L) => l.ar.trim().length > 0 && l.en.trim().length > 0;

describe('product catalog', () => {
  it('has the 8 researched products with unique, URL-safe slugs', () => {
    expect(PRODUCTS).toHaveLength(8);
    const slugs = PRODUCTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(productBySlug('love-story')?.slug).toBe('love-story');
    expect(productBySlug('nope')).toBeUndefined();
  });

  for (const p of PRODUCTS) {
    describe(p.slug, () => {
      it('has every required field in both languages', () => {
        for (const l of [p.name, p.season, p.headline, p.subheadline, p.primaryLabel, p.seo.title, p.seo.description]) {
          expect(filled(l)).toBe(true);
        }
        expect(p.bullets).toHaveLength(3);
        p.bullets.forEach((b) => expect(filled(b)).toBe(true));
        expect(p.steps).toHaveLength(3);
        p.steps.forEach((s) => expect(filled(s.title) && filled(s.body)).toBe(true));
        expect(p.audience.length).toBeGreaterThan(0);
        p.audience.forEach((a) => expect(filled(a)).toBe(true));
        p.faq.forEach((f) => expect(filled(f.q) && filled(f.a)).toBe(true));
        expect(p.emoji).not.toBe('');
      });

      it('has a valid primary CTA target', () => {
        const c = p.primary;
        if (c.kind === 'template') {
          expect(templateSlugs.has(c.slug)).toBe(true);
          expect(ctaPath(c)).toBe(`/t/${c.slug}`);
        } else if (c.kind === 'category') {
          expect(categorySlugs.has(c.slug)).toBe(true);
          expect(ctaPath(c)).toBe(`/templates/${c.slug}`);
        } else {
          expect(ctaPath(c)).toBeNull();
        }
        // Never the share-link player.
        expect(ctaPath(c) ?? '').not.toMatch(/^\/p\//);
      });

      it('has a live demo from the catalog or a static mock', () => {
        if (p.demoTemplate) expect(templateSlugs.has(p.demoTemplate)).toBe(true);
        else expect(p.mock).toBeDefined();
      });

      it('has honest pricing tiers', () => {
        expect(p.tiers.length).toBeGreaterThan(0);
        for (const tier of p.tiers) {
          expect(filled(tier.name)).toBe(true);
          expect(tier.features.length).toBeGreaterThan(0);
          tier.features.forEach((f) => expect(filled(f.text)).toBe(true));
          if (tier.price != null) expect(Number.isInteger(tier.price) && tier.price >= 0).toBe(true);
          if (tier.fulfilment === 'self') {
            // A self-serve tier quotes a real template's real checkout price.
            const tpl = TEMPLATE_CATALOG.find((t) => t.slug === tier.selfTemplate);
            expect(tpl, `${p.slug}: self tier needs a catalog template`).toBeDefined();
            expect(tier.price).toBe(tpl!.pricePiastres / 100);
          }
        }
        expect(p.tiers.filter((t) => t.featured).length).toBeLessThanOrEqual(1);
        // Every tier sells at least one thing that exists today.
        for (const tier of p.tiers) expect(tier.features.some((f) => !f.soon)).toBe(true);
        expect(startingPrice(p) === null || startingPrice(p)! >= 0).toBe(true);
      });

      it('builds a WhatsApp message that names the product', () => {
        for (const loc of ['ar', 'en'] as const) {
          const msg = whatsappMessage(p, loc, p.tiers[0]);
          expect(msg).toContain(p.name[loc]);
          const href = whatsappHref('https://wa.me/201000000000', msg)!;
          expect(href.startsWith('https://wa.me/201000000000?text=')).toBe(true);
          expect(decodeURIComponent(href.split('?text=')[1]!)).toBe(msg);
        }
        expect(whatsappHref(null, 'x')).toBeNull();
      });
    });
  }
});

describe('products messages', () => {
  it('has the same keys in Arabic and English', () => {
    const keys = (o: unknown, pre = ''): string[] =>
      Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
        v && typeof v === 'object' ? keys(v, `${pre}${k}.`) : [`${pre}${k}`],
      );
    expect(keys(arMessages).sort()).toEqual(keys(enMessages).sort());
  });
});
