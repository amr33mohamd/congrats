/**
 * QA — Template contract validators (lib/template-contract.ts). Covers:
 *  (4) valid TemplateDefinition passes; malformed shapes fail; a BoundExperience
 *      must reference its template's scene slots/ids coherently.
 */
import { describe, it, expect } from 'vitest';
import {
  parseTemplateDefinition,
  safeParseTemplateDefinition,
  parseBoundExperience,
  safeParseBoundExperience,
  sceneForStep,
  applyTokens,
  type TemplateDefinition,
} from '@/lib/template-contract';

const validDef = {
  version: 1,
  locale: 'en' as const,
  direction: 'ltr' as const,
  theme: { palette: ['#fff', '#000'] },
  scenes: [
    {
      id: 'cover',
      type: 'Cover' as const,
      holdMs: 3000,
      transitionIn: { preset: 'fade' as const, durationMs: 800, delayMs: 0 },
      slots: [
        { key: 'heading', type: 'text' as const, editable: true, required: true, maxLen: 40, defaultEn: 'Hi {recipient}' },
        { key: 'photo', type: 'image' as const, editable: true, min: 1, max: 1, aspect: '1:1' },
      ],
    },
    { id: 'finale', type: 'Finale' as const, holdMs: 5000, slots: [] },
  ],
};

describe('TemplateDefinition validation', () => {
  it('accepts a well-formed definition and applies schema defaults', () => {
    const def = parseTemplateDefinition(validDef) as TemplateDefinition;
    expect(def.scenes).toHaveLength(2);
    // defaults applied by zod
    expect(def.scenes[1].holdMs).toBe(5000);
    expect(def.version).toBe(1);
  });

  it('rejects an unknown scene type', () => {
    const bad = { ...validDef, scenes: [{ id: 'x', type: 'Hologram', slots: [] }] };
    expect(safeParseTemplateDefinition(bad).success).toBe(false);
  });

  it('rejects an unknown animation preset', () => {
    const bad = {
      ...validDef,
      scenes: [{ id: 'x', type: 'Cover', holdMs: 1000, transitionIn: { preset: 'warp', durationMs: 100 }, slots: [] }],
    };
    expect(safeParseTemplateDefinition(bad).success).toBe(false);
  });

  it('rejects empty scenes', () => {
    expect(safeParseTemplateDefinition({ ...validDef, scenes: [] }).success).toBe(false);
  });

  it('rejects a bad locale/direction', () => {
    expect(safeParseTemplateDefinition({ ...validDef, locale: 'fr' }).success).toBe(false);
    expect(safeParseTemplateDefinition({ ...validDef, direction: 'sideways' }).success).toBe(false);
  });

  it('rejects a non-positive holdMs / maxLen', () => {
    const badHold = { ...validDef, scenes: [{ id: 'c', type: 'Cover', holdMs: 0, slots: [] }] };
    expect(safeParseTemplateDefinition(badHold).success).toBe(false);
    const badMax = {
      ...validDef,
      scenes: [{ id: 'c', type: 'Cover', holdMs: 1000, slots: [{ key: 'h', type: 'text', maxLen: -5 }] }],
    };
    expect(safeParseTemplateDefinition(badMax).success).toBe(false);
  });
});

describe('BoundExperience validation against its template', () => {
  const def = parseTemplateDefinition(validDef) as TemplateDefinition;

  function boundFor(stepIds: string[]) {
    return {
      experienceId: 'exp-1',
      templateId: 'tpl-1',
      locale: 'en' as const,
      direction: 'ltr' as const,
      recipientName: 'Sam',
      theme: def.theme,
      scenes: def.scenes,
      steps: stepIds.map((id, i) => ({
        templateStepId: id,
        orderIndex: i,
        text: { heading: 'Hi Sam' },
        media: [],
        animationConfig: {},
      })),
    };
  }

  it('a coherent BoundExperience parses', () => {
    const bound = parseBoundExperience(boundFor(['cover', 'finale']));
    expect(bound.steps).toHaveLength(2);
    // every step must resolve to a real scene in the template.
    for (const step of bound.steps) {
      expect(sceneForStep(bound, step)).toBeDefined();
    }
  });

  it('a BoundExperience whose step ids do NOT match any scene is structurally parseable but semantically dangling', () => {
    // The schema does not cross-check ids (by contract), so the SEMANTIC guarantee
    // is enforced via sceneForStep returning undefined — assert that signal exists.
    const bound = parseBoundExperience(boundFor(['ghost-scene']));
    expect(sceneForStep(bound, bound.steps[0])).toBeUndefined();
  });

  it('rejects a BoundExperience with no steps', () => {
    const res = safeParseBoundExperience({ ...boundFor([]), steps: [] });
    expect(res.success).toBe(false);
  });

  it('rejects a BoundExperience with no scenes', () => {
    const res = safeParseBoundExperience({ ...boundFor(['cover']), scenes: [] });
    expect(res.success).toBe(false);
  });

  it('rejects a media entry missing its slot', () => {
    const broken = boundFor(['cover']);
    (broken.steps[0] as { media: unknown[] }).media = [{ url: 'http://x/y.png' }]; // no slot
    expect(safeParseBoundExperience(broken).success).toBe(false);
  });

  it('rejects a negative orderIndex', () => {
    const broken = boundFor(['cover']);
    broken.steps[0].orderIndex = -1;
    expect(safeParseBoundExperience(broken).success).toBe(false);
  });
});

describe('token + scene helpers', () => {
  it('applyTokens substitutes {recipient} and {name}', () => {
    expect(applyTokens('Hi {recipient} & {name}', 'Lee')).toBe('Hi Lee & Lee');
  });
  it('sceneForStep resolves by templateStepId', () => {
    const def = parseTemplateDefinition(validDef);
    expect(sceneForStep(def as never, { templateStepId: 'finale' })?.type).toBe('Finale');
    expect(sceneForStep(def as never, { templateStepId: 'nope' })).toBeUndefined();
  });
});

/* ───────────────────────── the shipped catalog ────────────────────────── */

describe('template catalog (content/templates)', () => {
  // Imported inside the suite so a broken template reports as a failed test
  // here rather than as an unrelated import crash.
  const load = async () => (await import('@/content/templates')).TEMPLATE_CATALOG;

  /**
   * Row metadata a rewrite must never move: orders, prices and saved cards key
   * off it. [slug, category, locale, isPaid, pricePiastres]
   */
  const ROWS: Array<[string, string, 'ar' | 'en', boolean, number]> = [
    ['anniversary-our-story-en', 'anniversary', 'en', false, 0],
    ['anniversary-hobbna-ar', 'anniversary', 'ar', true, 4900],
    ['valentine-be-mine-en', 'valentine', 'en', false, 0],
    ['valentine-ya-albi-ar', 'valentine', 'ar', true, 4900],
    ['proposal-marry-me-en', 'proposal', 'en', true, 7900],
    ['proposal-etgawezini-ar', 'proposal', 'ar', true, 7900],
    ['eid-blessings-ar', 'eid', 'ar', true, 4900],
    ['eid-mubarak-en', 'eid', 'en', false, 0],
    ['birthday-make-a-wish-en', 'birthday', 'en', false, 0],
    ['birthday-kol-sana-ar', 'birthday', 'ar', false, 0],
    ['graduation-cap-and-gown-en', 'graduation', 'en', false, 0],
    ['graduation-mabrouk-ar', 'graduation', 'ar', true, 4900],
    ['newborn-welcome-little-one-en', 'newborn', 'en', false, 0],
    ['newborn-mabrouk-elmawloud-ar', 'newborn', 'ar', false, 0],
    ['wedding-two-hearts-en', 'wedding', 'en', true, 7900],
    ['wedding-mabrouk-elzawag-ar', 'wedding', 'ar', true, 7900],
  ];

  /**
   * Scene ids saved cards bind to (steps.template_step_id) that survived the
   * one-page rewrite. Removing one orphans that section of every saved card,
   * so it has to be a deliberate edit here too.
   */
  const KEPT_IDS: Record<string, string[]> = {
    'anniversary-our-story-en': ['cover', 'the-day-we-met', 'vow', 'milestones', 'gallery', 'letter', 'keepsake', 'finale'],
    'anniversary-hobbna-ar': ['cover', 'awwel-youm', 'kelma', 'hekayetna', 'zekrayat', 'gawab', 'hadiya', 'finale'],
    'valentine-be-mine-en': ['cover', 'love-note', 'our-photo', 'moments', 'love-quote', 'reasons', 'gift', 'finale'],
    'valentine-ya-albi-ar': ['cover', 'resala', 'sora', 'lahazat', 'eqtebas', 'asbab', 'hadiya', 'finale'],
    'proposal-marry-me-en': ['cover', 'journey', 'us', 'truth', 'the-ring', 'the-question', 'finale'],
    'proposal-etgawezini-ar': ['cover', 'rehletna', 'ehna', 'haqiqa', 'el-khatem', 'el-soaal', 'finale'],
    'eid-blessings-ar': ['cover', 'blessing', 'lanterns', 'lamma', 'gift', 'doaa', 'finale'],
    'eid-mubarak-en': ['cover', 'blessing', 'photo', 'gathering', 'gift', 'finale'],
    'birthday-make-a-wish-en': ['cover', 'star', 'memories', 'wish-message', 'countdown', 'gift', 'finale'],
    'birthday-kol-sana-ar': ['cover', 'negm', 'zekrayat', 'omneya', 'tanazol', 'hadiya', 'finale'],
    'graduation-cap-and-gown-en': ['cover', 'the-grad', 'tassel', 'journey', 'years', 'ceremony', 'gift', 'finale'],
    'graduation-mabrouk-ar': ['cover', 'el-khreeg', 'el-rehla', 'el-seneen', 'el-haflaa', 'hadiya', 'finale'],
    'newborn-welcome-little-one-en': ['cover', 'the-baby', 'details', 'tiny-toes', 'blessing', 'letter', 'keepsake', 'finale'],
    'newborn-mabrouk-elmawloud-ar': ['cover', 'el-baby', 'tafaseel', 'koraat', 'doaa', 'gawab', 'hadiya', 'finale'],
    'wedding-two-hearts-en': ['cover', 'the-couple', 'vow', 'gallery', 'countdown', 'blessing', 'gift', 'finale'],
    'wedding-mabrouk-elzawag-ar': ['cover', 'el-3roosain', 'doaa-quote', 'maaak-bas', 'tanazol', 'doaa', 'hadiya', 'finale'],
  };

  it('every template parses against the contract', async () => {
    const catalog = await load();
    expect(catalog.length).toBeGreaterThanOrEqual(26);
    for (const t of catalog) {
      expect(safeParseTemplateDefinition(t.definition).success, t.slug).toBe(true);
    }
  });

  it('keeps every greeting template’s slug, category, locale and price', async () => {
    const catalog = await load();
    for (const [slug, category, locale, isPaid, price] of ROWS) {
      const t = catalog.find((x) => x.slug === slug);
      expect(t, slug).toBeDefined();
      expect([t!.category, t!.locale, t!.isPaid, t!.pricePiastres], slug).toEqual([category, locale, isPaid, price]);
    }
  });

  it('keeps the scene ids saved cards bind to', async () => {
    const catalog = await load();
    for (const [slug, ids] of Object.entries(KEPT_IDS)) {
      const have = new Set(catalog.find((t) => t.slug === slug)!.definition.scenes.map((s) => s.id));
      expect(ids.filter((id) => !have.has(id)), slug).toEqual([]);
    }
  });

  it('labels every text and date field in both languages', async () => {
    const catalog = await load();
    for (const t of catalog) {
      for (const scene of t.definition.scenes) {
        for (const slot of scene.slots) {
          // Bound slots are never shown — their card-level field is (below).
          if (slot.type === 'image' || slot.bind) continue;
          const where = `${t.slug} › ${scene.id} › ${slot.key}`;
          expect(slot.labelEn?.trim(), where).toBeTruthy();
          expect(slot.labelAr?.trim(), where).toBeTruthy();
        }
      }
      for (const f of t.definition.fields ?? []) {
        expect(f.labelEn?.trim(), `${t.slug} › field ${f.key}`).toBeTruthy();
        expect(f.labelAr?.trim(), `${t.slug} › field ${f.key}`).toBeTruthy();
      }
    }
  });

  it('every bind/fallback points at a field the template declares', async () => {
    const catalog = await load();
    for (const t of catalog) {
      const keys = new Set((t.definition.fields ?? []).map((f) => f.key));
      for (const scene of t.definition.scenes) {
        for (const slot of scene.slots) {
          const ref = slot.bind ?? slot.fallback;
          if (ref) expect(keys.has(ref), `${t.slug} › ${scene.id} › ${slot.key} → ${ref}`).toBe(true);
        }
      }
    }
  });

  it('never asks for the same date twice unless the dates genuinely differ', async () => {
    const catalog = await load();
    for (const t of catalog) {
      // Plain (unbound, no fallback) date questions per card. Newborn is the one
      // template with two real dates: the birth and the naming party.
      const plain = t.definition.scenes.flatMap((sc) =>
        sc.slots.filter((s) => s.type === 'date' && !s.bind && !s.fallback),
      );
      expect(plain.length, t.slug).toBeLessThanOrEqual(t.category === 'newborn' ? 2 : 1);
    }
  });

  it('matches direction to locale and writes defaults in the card’s own language', async () => {
    const catalog = await load();
    const arabic = /[؀-ۿ]/;
    for (const t of catalog) {
      expect(t.definition.direction, t.slug).toBe(t.locale === 'ar' ? 'rtl' : 'ltr');
      for (const scene of t.definition.scenes) {
        for (const slot of scene.slots) {
          if (slot.type !== 'text' || slot.bind) continue;
          const where = `${t.slug} › ${scene.id} › ${slot.key}`;
          const value = t.locale === 'ar' ? slot.defaultAr : slot.defaultEn;
          expect(value, where).toBeDefined();
          if (t.locale === 'ar' && value) expect(value, where).toMatch(arabic);
        }
      }
    }
  });

  it('has a renderer for every scene type it uses, and unique scene ids', async () => {
    const { SCENE_RENDERERS } = await import('@/components/player/SceneRenderer');
    const catalog = await load();
    for (const t of catalog) {
      const ids = t.definition.scenes.map((s) => s.id);
      expect(new Set(ids).size, t.slug).toBe(ids.length);
      for (const scene of t.definition.scenes) {
        expect(typeof SCENE_RENDERERS[scene.type], `${t.slug} › ${scene.type}`).toBe('function');
      }
    }
  });

  it('never requires a photo, so a card is publishable before any upload', async () => {
    const catalog = await load();
    for (const t of catalog) {
      for (const scene of t.definition.scenes) {
        for (const slot of scene.slots.filter((s) => s.type === 'image')) {
          const where = `${t.slug} › ${scene.id} › ${slot.key}`;
          expect(slot.required, where).toBe(false);
          expect(slot.min ?? 0, where).toBe(0);
        }
      }
    }
  });

  it('reads each greeting card as one page: cover, a letter, …, finale', async () => {
    const catalog = await load();
    for (const t of catalog.filter((x) => x.category !== 'invitation')) {
      const types = t.definition.scenes.map((s) => s.type);
      expect(types[0], t.slug).toBe('Cover');
      expect(types[1], t.slug).toBe('Letter');
      expect(types[types.length - 1], t.slug).toBe('Finale');
      // The ornament frames only the tall ends; a mid-card section opens with a
      // flourish instead of an arch squeezed around four lines.
      for (const scene of t.definition.scenes.slice(1, -1)) {
        expect(scene.ornament?.kind, `${t.slug} › ${scene.id}`).toBe('none');
      }
      // Dates ship empty so no new card counts down to a day long gone.
      for (const scene of t.definition.scenes) {
        for (const slot of scene.slots.filter((s) => s.type === 'date')) {
          expect(slot.defaultAr ?? slot.defaultEn, `${t.slug} › ${scene.id}`).toBeUndefined();
        }
      }
    }
  });

  it('uses the slot keys the information sections actually read', async () => {
    const KEYS: Record<string, string[]> = {
      Event: ['label', 'venue', 'when', 'date'],
      Venue: ['heading', 'address', 'mapUrl'],
      Rsvp: ['heading', 'body', 'phone'],
      Gift: ['heading', 'body', 'account'],
      // The invitations' title key (FamiliesScene also accepts `heading`).
      Families: ['familiesHeading', 'groomLabel', 'groomFamily', 'brideLabel', 'brideFamily'],
    };
    const catalog = await load();
    for (const t of catalog) {
      for (const scene of t.definition.scenes) {
        const want = KEYS[scene.type];
        if (!want) continue;
        expect(scene.slots.map((s) => s.key).sort(), `${t.slug} › ${scene.id}`).toEqual([...want].sort());
      }
    }
  });
});

describe('soundtrack manifest (lib/audio.ts)', () => {
  it('only lists catalog tracks whose file actually ships', async () => {
    const { SHIPPED_TRACKS, TRACK_KEYS } = await import('@/lib/audio');
    const { existsSync } = await import('node:fs');
    const { join } = await import('node:path');
    for (const key of SHIPPED_TRACKS) {
      expect((TRACK_KEYS as readonly string[]).includes(key), key).toBe(true);
      expect(existsSync(join(process.cwd(), 'public', 'audio', `${key}.mp3`)), key).toBe(true);
    }
  });

  it('resolves no URL for a track that has not shipped, so nothing 404s', async () => {
    const { trackUrl } = await import('@/lib/audio');
    expect(trackUrl('wedding-strings', new Set())).toBeNull();
    expect(trackUrl('wedding-strings', new Set(['wedding-strings']))).toBe('/audio/wedding-strings.mp3');
    expect(trackUrl('../etc/passwd', new Set(['../etc/passwd']))).toBeNull();
    expect(trackUrl(undefined)).toBeNull();
  });

  it('every catalog music key is a known track', async () => {
    const { TRACK_KEYS } = await import('@/lib/audio');
    for (const t of (await import('@/content/templates')).TEMPLATE_CATALOG) {
      const music = t.definition.theme.music;
      if (music) expect((TRACK_KEYS as readonly string[]).includes(music), t.slug).toBe(true);
    }
  });
});
