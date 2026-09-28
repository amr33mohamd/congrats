import { describe, expect, it } from 'vitest';
import { parseTemplateDefinition } from '@/lib/template-contract';
import { defaultTextForScene, reconcileSteps } from './step-reconcile';

const def = parseTemplateDefinition({
  version: 1,
  locale: 'en',
  direction: 'ltr',
  theme: { palette: ['#fff'] },
  scenes: [
    {
      id: 'cover',
      type: 'Cover',
      slots: [{ key: 'heading', type: 'text', defaultEn: 'Hi {recipient}', defaultAr: 'أهلًا {recipient}' }],
    },
    {
      id: 'event',
      type: 'Event',
      slots: [
        { key: 'date', type: 'date', defaultEn: 'Friday', defaultAr: 'الجمعة' },
        { key: 'photo', type: 'image' },
        { key: 'venue', type: 'text' },
      ],
    },
    { id: 'finale', type: 'Finale', slots: [{ key: 'heading', type: 'text', defaultEn: 'Bye' }] },
  ],
});

type Row = { id: string; templateStepId: string; orderIndex: number };
const row = (id: string, templateStepId: string, orderIndex: number): Row => ({ id, templateStepId, orderIndex });

describe('defaultTextForScene', () => {
  it('seeds text/date slots in the requested locale, keeps tokens raw, skips images and undefaulted slots', () => {
    expect(defaultTextForScene(def.scenes[1], 'en')).toEqual({ date: 'Friday' });
    expect(defaultTextForScene(def.scenes[1], 'ar')).toEqual({ date: 'الجمعة' });
    expect(defaultTextForScene(def.scenes[0], 'en')).toEqual({ heading: 'Hi {recipient}' });
  });
});

describe('reconcileSteps', () => {
  it('is a no-op for steps that already match the definition', () => {
    const saved = [row('a', 'cover', 0), row('b', 'event', 1), row('c', 'finale', 2)];
    const r = reconcileSteps(def, saved, 'en');
    expect(r.needsPersist).toBe(false);
    expect(r.added).toEqual([]);
    expect(r.orphans).toEqual([]);
    expect(r.steps.map((s) => s.existing?.id)).toEqual(['a', 'b', 'c']);
  });

  it('adds missing scenes seeded with slot defaults, at their definition index', () => {
    const saved = [row('a', 'cover', 0), row('c', 'finale', 1)];
    const r = reconcileSteps(def, saved, 'en');
    expect(r.added).toEqual(['event']);
    expect(r.needsPersist).toBe(true);
    expect(r.steps.map((s) => [s.scene.id, s.orderIndex, s.existing?.id ?? null])).toEqual([
      ['cover', 0, 'a'],
      ['event', 1, null],
      ['finale', 2, 'c'],
    ]);
    expect(r.steps[1].defaultText).toEqual({ date: 'Friday' });
    // Existing steps never get defaults layered on (their text is the user's).
    expect(r.steps[0].defaultText).toEqual({});
  });

  it('orders by the definition, not by the saved order', () => {
    const saved = [row('c', 'finale', 0), row('a', 'cover', 1), row('b', 'event', 2)];
    const r = reconcileSteps(def, saved, 'en');
    expect(r.steps.map((s) => s.existing?.id)).toEqual(['a', 'b', 'c']);
    expect(r.needsPersist).toBe(true);
    expect(r.added).toEqual([]);
  });

  it('ignores orphans (removed/renamed scenes) and flags persistence only when they block an index', () => {
    const blocking = reconcileSteps(
      def,
      [row('a', 'cover', 0), row('x', 'old-scene', 1), row('b', 'event', 2), row('c', 'finale', 3)],
      'en',
    );
    expect(blocking.orphans.map((o) => o.id)).toEqual(['x']);
    expect(blocking.steps.map((s) => s.scene.id)).toEqual(['cover', 'event', 'finale']);
    expect(blocking.needsPersist).toBe(true);

    // An orphan already parked past the live scenes needs no write.
    const parked = reconcileSteps(
      def,
      [row('a', 'cover', 0), row('b', 'event', 1), row('c', 'finale', 2), row('x', 'old-scene', 3)],
      'en',
    );
    expect(parked.orphans.map((o) => o.id)).toEqual(['x']);
    expect(parked.needsPersist).toBe(false);
  });

  it('keeps the earliest row when a scene has duplicates and treats the rest as orphans', () => {
    const r = reconcileSteps(
      def,
      [row('a2', 'cover', 5), row('a1', 'cover', 0), row('b', 'event', 1), row('c', 'finale', 2)],
      'en',
    );
    expect(r.steps[0].existing?.id).toBe('a1');
    expect(r.orphans.map((o) => o.id)).toEqual(['a2']);
    expect(r.needsPersist).toBe(false);
  });

  it('seeds every scene for an experience with no saved steps', () => {
    const r = reconcileSteps(def, [] as Row[], 'ar');
    expect(r.added).toEqual(['cover', 'event', 'finale']);
    expect(r.steps[0].defaultText).toEqual({ heading: 'أهلًا {recipient}' });
    // No Arabic default on the finale slot → nothing seeded rather than English.
    expect(r.steps[2].defaultText).toEqual({});
  });

  it('does not mutate its input', () => {
    const saved = [row('c', 'finale', 0), row('a', 'cover', 1)];
    const copy = JSON.parse(JSON.stringify(saved));
    reconcileSteps(def, saved, 'en');
    expect(saved).toEqual(copy);
  });
});
