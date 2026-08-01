/**
 * QA — Player render smoke test (jsdom). (6)
 *
 * Mounts the shared Player with a validated BoundExperience and asserts it
 * renders the first scene's resolved copy, direction, and progress dots without
 * throwing. canvas-confetti is mocked (jsdom has no canvas) so the Finale scene
 * can mount too.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { parseBoundExperience, type BoundExperience } from '@/lib/template-contract';
import { Player } from '@/components/player';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

afterEach(() => cleanup());

const sample: BoundExperience = parseBoundExperience({
  experienceId: 'exp-1',
  templateId: 'tpl-1',
  locale: 'ar',
  direction: 'rtl',
  recipientName: 'سارة',
  theme: { palette: ['#111111', '#aa00aa'] },
  scenes: [
    {
      id: 'cover',
      type: 'Cover',
      holdMs: 4000,
      slots: [
        { key: 'heading', type: 'text', editable: true, defaultAr: 'مرحبا {recipient}' },
        { key: 'body', type: 'text', editable: true },
      ],
    },
    {
      id: 'text',
      type: 'TextReveal',
      holdMs: 4000,
      slots: [{ key: 'heading', type: 'text', editable: true }],
    },
    { id: 'finale', type: 'Finale', holdMs: 4000, slots: [{ key: 'heading', type: 'text', editable: true }] },
  ],
  steps: [
    { templateStepId: 'cover', orderIndex: 0, text: { heading: 'مرحبا {recipient}', body: 'كل عام وأنتِ بخير' }, media: [], animationConfig: {} },
    { templateStepId: 'text', orderIndex: 1, text: { heading: 'نحبك' }, media: [], animationConfig: {} },
    { templateStepId: 'finale', orderIndex: 2, text: { heading: 'مبروك' }, media: [], animationConfig: {} },
  ],
});

describe('Player render', () => {
  it('renders the container with the correct direction and one progress dot per step', () => {
    render(<Player experience={sample} startPaused={false} />);
    const root = screen.getByTestId('player-root');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('dir', 'rtl');
    // 3 steps → 3 progress dots (the small w-6 bars). Count via the dots container.
    const dots = root.querySelectorAll('.rounded-pill.h-1, span.h-1');
    expect(dots.length).toBeGreaterThanOrEqual(3);
  });

  it('renders the first scene copy with the {recipient} token resolved', () => {
    render(<Player experience={sample} startPaused={false} />);
    // Cover heading: 'مرحبا {recipient}' → recipient 'سارة'
    expect(screen.getByText('مرحبا سارة')).toBeInTheDocument();
    expect(screen.getByText('كل عام وأنتِ بخير')).toBeInTheDocument();
  });

  it('shows the start overlay when startPaused and advances on tap', () => {
    render(<Player experience={sample} startPaused />);
    const root = screen.getByTestId('player-root');
    // paused → first scene copy not yet shown
    expect(screen.queryByText('مرحبا سارة')).not.toBeInTheDocument();
    fireEvent.click(root);
    // after tap it starts and renders the first scene
    expect(screen.getByText('مرحبا سارة')).toBeInTheDocument();
  });

  // NOTE on scene swapping: the Player wraps scenes in framer-motion's
  // <AnimatePresence mode="wait">, which keeps the OUTGOING scene mounted until
  // its exit animation reports completion. jsdom has no layout/raf loop, so the
  // exit "complete" callback never fires and the incoming scene is not swapped
  // in during a test. This is a jsdom limitation, not a Player bug (advancement
  // works in a real browser). We therefore assert advancement via the stable
  // observable signal — the progress dots (opacity 0.95 for i <= index).
  function activeDotCount(root: HTMLElement): number {
    return Array.from(root.querySelectorAll('span.h-1')).filter((el) =>
      (el as HTMLElement).style.opacity === '0.95',
    ).length;
  }

  it('advances the step index on tap (progress reflects the new index)', () => {
    render(<Player experience={sample} startPaused={false} />);
    const root = screen.getByTestId('player-root');
    expect(activeDotCount(root)).toBe(1); // on step 0
    fireEvent.click(root);
    expect(activeDotCount(root)).toBe(2); // advanced to step 1
    fireEvent.click(root);
    expect(activeDotCount(root)).toBe(3); // advanced to step 2 (Finale)
  });

  it('mounts and renders the initial Cover scene (confetti mocked) without throwing', () => {
    // Smoke: rendering the full BoundExperience does not throw and produces copy.
    expect(() => render(<Player experience={sample} startPaused={false} />)).not.toThrow();
    expect(screen.getByText('مرحبا سارة')).toBeInTheDocument();
  });

  it('renders a Finale-first experience and fires confetti via the mocked module', async () => {
    // A standalone experience whose only/first scene is the Finale, proving the
    // Finale renderer mounts (and uses the confetti mock) without a real canvas.
    const confetti = (await import('canvas-confetti')).default as unknown as ReturnType<typeof vi.fn>;
    confetti.mockClear?.();
    const finaleOnly = parseBoundExperience({
      experienceId: 'exp-2',
      templateId: 'tpl-2',
      locale: 'en',
      direction: 'ltr',
      recipientName: 'Sam',
      theme: { palette: ['#000', '#fff'] },
      scenes: [{ id: 'finale', type: 'Finale', holdMs: 4000, slots: [{ key: 'heading', type: 'text', editable: true }] }],
      steps: [{ templateStepId: 'finale', orderIndex: 0, text: { heading: 'Congrats Sam' }, media: [], animationConfig: {} }],
    });
    render(<Player experience={finaleOnly} startPaused={false} />);
    expect(screen.getByText('Congrats Sam')).toBeInTheDocument();
    expect(confetti).toHaveBeenCalled();
  });
});
