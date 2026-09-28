/**
 * QA — Player render smoke test (jsdom).
 *
 * The Player renders an experience as ONE scrolling card: every scene is a
 * stacked section revealed as it enters the viewport, rather than a deck of
 * tap-through slides. These tests assert that shape — all sections present,
 * direction honoured, tokens resolved, and the open gate withholding the card
 * until tapped.
 *
 * canvas-confetti is mocked (jsdom has no canvas) so a Finale can mount, and
 * IntersectionObserver is stubbed in vitest.setup so sections count as visible.
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
  it('renders the container with the correct direction and one section per step', () => {
    render(<Player experience={sample} startPaused={false} />);
    const root = screen.getByTestId('player-root');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('dir', 'rtl');
    expect(root.querySelectorAll('section[data-scene]')).toHaveLength(3);
  });

  it('renders the first scene copy with the {recipient} token resolved', () => {
    render(<Player experience={sample} startPaused={false} />);
    expect(screen.getByText('مرحبا سارة')).toBeInTheDocument();
    expect(screen.getByText('كل عام وأنتِ بخير')).toBeInTheDocument();
  });

  it('renders EVERY scene, not just the first — the card is one scrolling document', () => {
    render(<Player experience={sample} startPaused={false} />);
    const root = screen.getByTestId('player-root');
    // TextReveal animates per character, so its heading is split across spans —
    // match on the section's text content rather than a single text node.
    const text = (id: string) =>
      root.querySelector(`[data-scene="${id}"]`)?.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(text('cover')).toContain('مرحبا سارة');
    expect(text('text')).toContain('نحبك');
    expect(text('finale')).toContain('مبروك');
  });

  it('sections are addressable by step id so the builder can jump to one', () => {
    render(<Player experience={sample} startPaused={false} />);
    const root = screen.getByTestId('player-root');
    for (const id of ['cover', 'text', 'finale']) {
      expect(root.querySelector(`[data-scene="${id}"]`)).not.toBeNull();
    }
  });

  it('covers the card with the open gate until it is tapped', () => {
    render(<Player experience={sample} startPaused />);
    // The gate is an overlay, not a conditional render: the card is in the DOM
    // behind it (this is a shared link, not a secret), but the reader sees the
    // gate — which is also what legitimises audio playback on the tap.
    const open = screen.getByRole('button', { name: 'افتح الدعوة' });
    expect(open).toBeInTheDocument();
    expect(screen.getByText('سارة')).toBeInTheDocument(); // the guest is named on the gate
    fireEvent.click(open);
    expect(screen.queryByRole('button', { name: 'افتح الدعوة' })).not.toBeInTheDocument();
    expect(screen.getByText('مرحبا سارة')).toBeInTheDocument();
  });

  it('renders a Finale-first experience and fires confetti via the mocked module', async () => {
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
