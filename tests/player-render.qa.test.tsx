/**
 * QA — Player render smoke test (jsdom).
 *
 * The Player renders an experience as ONE scrolling card: every scene is a
 * stacked section revealed as it enters the viewport, rather than a deck of
 * tap-through slides. These tests assert that shape — all sections present,
 * direction honoured, tokens resolved, empty sections left out, the open gate
 * withholding the card until tapped — and render every catalog template.
 *
 * canvas-confetti is mocked (jsdom has no canvas): `create` hands back a fake
 * scoped instance so we can assert bursts go to the section's own canvas and
 * never to the library's full-window one. IntersectionObserver is stubbed in
 * vitest.setup so sections count as visible.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { parseBoundExperience, type BoundExperience } from '@/lib/template-contract';
import { buildPreviewExperience } from '@/lib/template-preview';
import { TEMPLATE_CATALOG } from '@/content/templates';
import { Player } from '@/components/player';

const confettiMock = vi.hoisted(() => {
  const scoped = Object.assign(vi.fn(() => Promise.resolve()), { reset: vi.fn() });
  const global = Object.assign(vi.fn(), { create: vi.fn(() => scoped) });
  return { global, scoped };
});
vi.mock('canvas-confetti', () => ({ default: confettiMock.global }));

beforeEach(() => {
  confettiMock.global.mockClear();
  confettiMock.global.create.mockClear();
  confettiMock.scoped.mockClear();
  confettiMock.scoped.reset.mockClear();
});
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

const sectionIds = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>('section[data-scene]')).map((s) => s.dataset.scene);

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
    // TextReveal animates piece by piece, so its heading is split across
    // spans — match on the section's text content rather than one text node.
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

  it('gates a greeting card behind "open your card", naming the recipient', () => {
    render(<Player experience={sample} startPaused />);
    // The gate is an overlay, not a conditional render: the card is in the DOM
    // behind it (this is a shared link, not a secret), but the reader sees the
    // gate — which is also what legitimises audio playback on the tap.
    const open = screen.getByRole('button', { name: 'افتح الكارت' });
    expect(screen.getByText('سارة')).toBeInTheDocument();
    fireEvent.click(open);
    expect(screen.queryByRole('button', { name: 'افتح الكارت' })).not.toBeInTheDocument();
    expect(screen.getByText('مرحبا سارة')).toBeInTheDocument();
  });

  it('gates an invitation with the invitation wording and the guest name', () => {
    const invite = TEMPLATE_CATALOG.find((t) => t.slug === 'invitation-ivory-arch-ar')!;
    const exp = buildPreviewExperience(invite.definition, {
      templateId: invite.slug,
      category: invite.category,
      recipientName: 'أحمد',
    });
    render(<Player experience={exp} startPaused />);
    expect(screen.getByRole('button', { name: 'افتح الدعوة' })).toBeInTheDocument();
    expect(screen.getByText('يدعوكم لمشاركة الفرحة')).toBeInTheDocument();
    // The families title lives under `familiesHeading`; it used to never show.
    expect(screen.getByText('أهل العروسين')).toBeInTheDocument();
  });

  it('fires confetti into a canvas scoped to the section, never the full-window canvas', () => {
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
    const { unmount } = render(<Player experience={finaleOnly} startPaused={false} />);
    expect(screen.getByText('Congrats Sam')).toBeInTheDocument();

    const canvas = screen.getByTestId('confetti-canvas');
    expect(canvas.closest('section[data-scene="finale"]')).not.toBeNull();
    expect(confettiMock.global.create).toHaveBeenCalledWith(canvas, expect.objectContaining({ resize: true }));
    expect(confettiMock.scoped).toHaveBeenCalled();
    // The global instance paints a fixed full-window canvas — it must never fire.
    expect(confettiMock.global).not.toHaveBeenCalled();

    unmount();
    expect(confettiMock.scoped.reset).toHaveBeenCalled();
  });

  it('leaves out sections with nothing in them', () => {
    const exp = parseBoundExperience({
      experienceId: 'exp-3',
      templateId: 'tpl-3',
      locale: 'en',
      direction: 'ltr',
      recipientName: 'Sam',
      theme: { palette: ['#000000', '#222222'] },
      scenes: [
        { id: 'cover', type: 'Cover', slots: [{ key: 'heading', type: 'text' }] },
        { id: 'photo', type: 'PhotoReveal', slots: [{ key: 'image', type: 'image' }, { key: 'caption', type: 'text' }] },
        { id: 'gallery', type: 'Gallery', slots: [{ key: 'gallery', type: 'image', max: 6 }, { key: 'heading', type: 'text' }] },
        { id: 'count', type: 'Countdown', slots: [{ key: 'lead', type: 'text' }, { key: 'targetDate', type: 'date' }] },
        { id: 'party', type: 'Event', slots: [{ key: 'label', type: 'text' }, { key: 'venue', type: 'text' }, { key: 'date', type: 'date' }] },
        { id: 'finale', type: 'Finale', slots: [{ key: 'heading', type: 'text' }] },
      ],
      steps: [
        { templateStepId: 'cover', orderIndex: 0, text: { heading: 'Hi Sam' } },
        // Caption but no photo: a caption floating over nothing.
        { templateStepId: 'photo', orderIndex: 1, text: { caption: 'Look at us' } },
        { templateStepId: 'gallery', orderIndex: 2, text: { heading: 'Moments' } },
        // A countdown with no date has nothing to count.
        { templateStepId: 'count', orderIndex: 3, text: { lead: 'Counting down' } },
        // Every field cleared by the sender — how an optional section is removed.
        { templateStepId: 'party', orderIndex: 4, text: { label: ' ', venue: '' } },
        { templateStepId: 'finale', orderIndex: 5, text: { heading: 'Bye' } },
        // A step whose scene no longer exists in the template.
        { templateStepId: 'retired-scene', orderIndex: 6, text: { heading: 'old' } },
      ],
    });
    render(<Player experience={exp} startPaused={false} />);
    expect(sectionIds(screen.getByTestId('player-root'))).toEqual(['cover', 'finale']);
  });

  it('shows a photo section once it has a photo, and a countdown once it has a date', () => {
    const exp = parseBoundExperience({
      experienceId: 'exp-4',
      templateId: 'tpl-4',
      locale: 'en',
      direction: 'ltr',
      theme: { palette: ['#000000', '#222222'] },
      scenes: [
        { id: 'photo', type: 'PhotoReveal', slots: [{ key: 'image', type: 'image' }] },
        { id: 'count', type: 'Countdown', slots: [{ key: 'lead', type: 'text' }, { key: 'targetDate', type: 'date' }] },
      ],
      steps: [
        { templateStepId: 'photo', orderIndex: 0, media: [{ slot: 'image', url: 'https://example.com/a.jpg' }] },
        { templateStepId: 'count', orderIndex: 1, text: { lead: 'Soon', targetDate: '2099-01-01' } },
      ],
    });
    render(<Player experience={exp} startPaused={false} />);
    expect(sectionIds(screen.getByTestId('player-root'))).toEqual(['photo', 'count']);
  });

  it('fires onComplete once, when the last visible section is reached', () => {
    const onComplete = vi.fn();
    const { rerender } = render(<Player experience={sample} startPaused={false} onComplete={onComplete} />);
    rerender(<Player experience={sample} startPaused={false} onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('renders no soundtrack control (and requests no file) when the track has not shipped', () => {
    const withMusic = parseBoundExperience({ ...sample, theme: { ...sample.theme, music: 'not-a-shipped-track' } });
    const { container } = render(<Player experience={withMusic} startPaused={false} />);
    expect(container.querySelector('audio')).toBeNull();
    expect(screen.queryByRole('button', { name: 'الموسيقى' })).not.toBeInTheDocument();
  });

  it('plays the template music, with its control, once the card is open', () => {
    const withMusic = parseBoundExperience({ ...sample, theme: { ...sample.theme, music: 'wedding-strings' } });
    const { container } = render(<Player experience={withMusic} startPaused={false} />);
    expect(container.querySelector('audio')?.getAttribute('src')).toBe('/audio/wedding-strings.mp3');
    expect(screen.getByRole('button', { name: 'الموسيقى' })).toBeInTheDocument();
  });

  it('keeps Arabic words whole in the typewriter heading (no per-letter split)', () => {
    render(<Player experience={sample} startPaused={false} />);
    const heading = screen.getByTestId('player-root').querySelector('[data-scene="text"] h2')!;
    // One animated piece per word, not per letter: splitting a joined script
    // into letters breaks the joins.
    const pieces = Array.from(heading.querySelectorAll('span')).map((s) => s.textContent);
    expect(pieces).toContain('نحبك');
  });
});

describe('every catalog template renders as a one-page card', () => {
  for (const tpl of TEMPLATE_CATALOG) {
    it(`${tpl.slug}`, () => {
      const exp = buildPreviewExperience(tpl.definition, {
        templateId: tpl.slug,
        category: tpl.category,
        recipientName: tpl.locale === 'ar' ? 'سارة' : 'Sara',
      });
      render(<Player experience={exp} startPaused={false} />);
      const root = screen.getByTestId('player-root');
      expect(root).toHaveAttribute('dir', tpl.locale === 'ar' ? 'rtl' : 'ltr');
      // The preview fills every photo and date, so every scene shows.
      expect(sectionIds(root)).toEqual(tpl.definition.scenes.map((s) => s.id));
      // Tokens are always resolved on screen.
      expect(root.textContent).not.toContain('{recipient}');
      cleanup();
    });
  }
});
