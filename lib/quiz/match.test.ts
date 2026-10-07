import { describe, expect, it } from 'vitest';
import { TEMPLATE_CATALOG } from '@/content/templates';
import { colorFamily, matchTemplates, scoreTemplate, templateColors, templateStyle, type MatchCandidate } from './match';
import { OCCASIONS, OCCASION_INFO, type QuizAnswers } from './answers';

const CATALOG: MatchCandidate[] = TEMPLATE_CATALOG.map((t) => ({
  id: t.slug,
  slug: t.slug,
  locale: t.locale,
  categorySlug: t.category,
  definition: t.definition,
}));

const slugsOf = (r: ReturnType<typeof matchTemplates>) => (r ? [r.best.slug, ...r.alternatives.map((t) => t.slug)] : []);

describe('colorFamily', () => {
  it('reads the catalog swatches the way a person would name them', () => {
    expect(colorFamily('#C9A227')).toBe('gold');
    expect(colorFamily('#7A1424')).toBe('burgundy');
    expect(colorFamily('#2A0E1B')).toBe('burgundy');
    expect(colorFamily('#1F3358')).toBe('navy');
    expect(colorFamily('#4A6FA5')).toBe('navy');
    expect(colorFamily('#7C8A6B')).toBe('green');
    expect(colorFamily('#F4B6C2')).toBe('pink');
    expect(colorFamily('#F6EEDC')).toBe('ivory');
    expect(colorFamily('#FFFFFF')).toBe('ivory');
  });

  it('ignores greys and garbage', () => {
    expect(colorFamily('#333333')).toBeNull();
    expect(colorFamily('not-a-colour')).toBeNull();
  });
});

describe('templateStyle', () => {
  const style = (slug: string) => templateStyle(CATALOG.find((t) => t.slug === slug)!);

  it('maps each invitation art direction to its quiz style', () => {
    expect(style('invitation-ivory-arch-ar')).toBe('classic-gold');
    expect(style('invitation-qasr-gold-ar')).toBe('classic-gold');
    expect(style('invitation-baroque-noir-ar')).toBe('luxe-noir');
    expect(style('invitation-tarab-velvet-ar')).toBe('tarab');
    expect(style('invitation-sage-garden-ar')).toBe('soft-nature');
    expect(style('invitation-blue-porcelain-en')).toBe('porcelain');
  });

  it('reads greeting cards from their theme', () => {
    expect(style('birthday-kol-sana-ar')).toBe('joyful');
    expect(style('anniversary-hobbna-ar')).toBe('luxe-noir');
    expect(style('newborn-mabrouk-elmawloud-ar')).toBe('soft-nature');
  });

  it('every catalog template has colour families', () => {
    for (const t of CATALOG) expect(templateColors(t.definition).size).toBeGreaterThan(0);
  });
});

describe('matchTemplates', () => {
  it('returns the chosen invitation style in the chosen language', () => {
    const r = matchTemplates(CATALOG, { occasion: 'wedding', style: 'tarab', lang: 'ar' });
    expect(r?.best.slug).toBe('invitation-tarab-velvet-ar');
  });

  it('serves engagement and henna from the invitation designs', () => {
    expect(matchTemplates(CATALOG, { occasion: 'engagement', style: 'porcelain', lang: 'en' })?.best.slug).toBe(
      'invitation-blue-porcelain-en',
    );
    expect(matchTemplates(CATALOG, { occasion: 'henna', style: 'soft-nature', lang: 'ar' })?.best.slug).toBe(
      'invitation-sage-garden-ar',
    );
  });

  it('gives two alternatives, each a different design (never the same card in the other language)', () => {
    const r = matchTemplates(CATALOG, { occasion: 'wedding', style: 'luxe-noir', lang: 'ar' });
    const slugs = slugsOf(r);
    expect(slugs).toHaveLength(3);
    const designs = slugs.map((s) => s.replace(/-(ar|en)$/, ''));
    expect(new Set(designs).size).toBe(3);
    // Alternatives stay in the occasion and the language when they can.
    for (const s of slugs) expect(s).toMatch(/^invitation-.*-ar$/);
  });

  it('lets colours break a tie between styles', () => {
    // ivory-arch (navy ground) and qasr-gold (cream) are both "classic gold".
    const navy = matchTemplates(CATALOG, { occasion: 'wedding', style: 'classic-gold', colors: ['navy'], lang: 'ar' });
    expect(navy?.best.slug).toBe('invitation-ivory-arch-ar');
  });

  it('falls back to related occasions when the category is thin', () => {
    const r = matchTemplates(CATALOG, { occasion: 'birthday', style: 'joyful', lang: 'ar' });
    expect(r?.best.slug).toBe('birthday-kol-sana-ar');
    expect(r?.alternatives[0].slug).toBe('birthday-make-a-wish-en');
    expect(r?.alternatives[1].categorySlug).toBe('graduation');
  });

  it('every occasion finds a template from its own category', () => {
    for (const occasion of OCCASIONS) {
      const r = matchTemplates(CATALOG, { occasion, lang: 'ar' } as QuizAnswers);
      expect(r?.best.categorySlug).toBe(OCCASION_INFO[occasion].category);
    }
  });

  it('category outweighs style, colours and language combined', () => {
    const birthday = CATALOG.find((t) => t.slug === 'birthday-kol-sana-ar')!;
    const invitation = CATALOG.find((t) => t.slug === 'invitation-qasr-gold-en')!;
    const a: QuizAnswers = { occasion: 'birthday', style: 'classic-gold', colors: ['gold', 'ivory'], lang: 'en' };
    expect(scoreTemplate(birthday, a)).toBeGreaterThan(scoreTemplate(invitation, a));
  });

  it('is empty-safe and stable', () => {
    expect(matchTemplates([], { occasion: 'eid' })).toBeNull();
    const a: QuizAnswers = { occasion: 'eid', lang: 'en' };
    expect(slugsOf(matchTemplates(CATALOG, a))).toEqual(slugsOf(matchTemplates(CATALOG, a)));
  });
});
