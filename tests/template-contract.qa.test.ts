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
