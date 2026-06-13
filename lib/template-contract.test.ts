import { describe, it, expect } from 'vitest';
import {
  parseTemplateDefinition,
  safeParseTemplateDefinition,
  applyTokens,
  sceneForStep,
  type TemplateDefinition,
} from './template-contract';

const validDef = {
  version: 1,
  locale: 'ar',
  direction: 'rtl',
  theme: { palette: ['#fff', '#000'] },
  scenes: [
    {
      id: 'cover',
      type: 'Cover',
      holdMs: 3000,
      transitionIn: { preset: 'fade', durationMs: 800 },
      slots: [{ key: 'heading', type: 'text', editable: true, defaultAr: 'مرحبا {recipient}' }],
    },
    { id: 'finale', type: 'Finale', holdMs: 5000, slots: [] },
  ],
};

describe('template contract', () => {
  it('parses a valid TemplateDefinition', () => {
    const def = parseTemplateDefinition(validDef) as TemplateDefinition;
    expect(def.scenes).toHaveLength(2);
    expect(def.direction).toBe('rtl');
  });

  it('rejects an invalid scene type', () => {
    const bad = { ...validDef, scenes: [{ id: 'x', type: 'Nope', slots: [] }] };
    expect(safeParseTemplateDefinition(bad).success).toBe(false);
  });

  it('rejects an empty scenes array', () => {
    expect(safeParseTemplateDefinition({ ...validDef, scenes: [] }).success).toBe(false);
  });

  it('substitutes the {recipient} token', () => {
    expect(applyTokens('مرحبا {recipient}', 'سارة')).toBe('مرحبا سارة');
    expect(applyTokens('Hi {name}', 'Sara')).toBe('Hi Sara');
  });

  it('resolves a scene by templateStepId', () => {
    const def = parseTemplateDefinition(validDef);
    const scene = sceneForStep(def as never, { templateStepId: 'finale' });
    expect(scene?.type).toBe('Finale');
  });
});
