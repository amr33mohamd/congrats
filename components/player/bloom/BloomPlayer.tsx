'use client';

/**
 * The White Bloom player (theme.stage === 'bloom').
 *
 * Opens on the wreath (./parts › Intro): the guest taps, pearls scatter off
 * the wreath, petals fall, and the camera flies through the wreath into the
 * card. The card is a column of painted panels, white flowers on white and on
 * turquoise, each section with its own movement (./sections). After opening
 * it glides down on its own until the guest touches it.
 *
 * Sections read the same slots as any card, so the builder edits it
 * unchanged; there every section shows settled (the ribbon untied, the arch
 * and the timeline drawn) and the cover sits in place at the top.
 */
import * as React from 'react';
import { sceneForStep, withLocaleFonts, type BoundStep, type SceneDef } from '@/lib/template-contract';
import { track } from '@/lib/track';
import { SceneRenderer } from '../SceneRenderer';
import { Soundtrack } from '../Soundtrack';
import { isSectionVisible, type PlayerProps } from '../Player';
import { BLOOM_CSS, BLOOM_FONTS_HREF, Intro, coverProps, text, usePrefersReducedMotion } from './parts';
import {
  Countdown,
  Invite,
  LAYOUT,
  Panel,
  Program,
  Rsvp,
  SaveDate,
  StageContext,
  ThankYou,
  Venue,
  Verse,
  type Layout,
  type Stage,
} from './sections';

/** Auto-scroll, as the design sets it: 60 px/s, starting 3 s after opening. */
const GLIDE_PX_PER_S = 60;
const GLIDE_DELAY_MS = 3000;
const GLIDE_RESUME_MS = 5000;

function useGlide(enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let last = 0;
    let pos = window.scrollY;
    let pausedUntil = performance.now() + GLIDE_DELAY_MS;
    const onUser = () => (pausedUntil = performance.now() + GLIDE_RESUME_MS);
    const events = ['pointerdown', 'touchstart', 'wheel', 'keydown'] as const;
    events.forEach((e) => window.addEventListener(e, onUser, { passive: true }));
    const frame = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      const a = document.activeElement;
      // A guest filling in the RSVP must not have it glide away.
      if (a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement || a instanceof HTMLSelectElement) {
        pausedUntil = now + GLIDE_RESUME_MS;
      }
      if (now < pausedUntil) {
        pos = window.scrollY;
      } else {
        const end = document.documentElement.scrollHeight - window.innerHeight;
        if (pos >= end - 1) return;
        pos = Math.min(end, pos + (GLIDE_PX_PER_S * dt) / 1000);
        window.scrollTo({ top: pos, behavior: 'instant' as ScrollBehavior });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      events.forEach((e) => window.removeEventListener(e, onUser));
    };
  }, [enabled]);
}

export default function BloomPlayer({
  experience: given,
  startPaused = true,
  startAtStepId,
  onComplete,
  embedded = false,
  soundtrack = true,
}: PlayerProps) {
  const experience = React.useMemo(() => withLocaleFonts(given), [given]);
  const reduced = usePrefersReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const ar = experience.direction === 'rtl';
  const theme = experience.theme;
  const fields = React.useMemo(() => experience.fields ?? {}, [experience.fields]);
  // The builder (never paused) shows everything settled and editable.
  const editor = !startPaused;
  const [music, setMusic] = React.useState(editor);
  const [opened, setOpened] = React.useState(editor);
  const [introGone, setIntroGone] = React.useState(editor);

  const sections = React.useMemo(() => {
    const out: Array<{ scene: SceneDef; step: BoundStep }> = [];
    for (const step of [...experience.steps].sort((a, b) => a.orderIndex - b.orderIndex)) {
      const scene = sceneForStep(experience, step);
      if (!scene) continue;
      // The panel art is not content: a section the sender emptied still goes.
      const bare = { ...scene, background: undefined } as SceneDef;
      if (isSectionVisible(bare, step, fields)) out.push({ scene, step });
    }
    return out;
  }, [experience, fields]);

  const cover = sections.find((x) => x.scene.type === 'Cover');
  const body = sections.filter((x) => x !== cover);
  const venue = sections.find((x) => x.scene.type === 'Venue');
  const address = venue ? text({ ...venue, experience }, 'address') : '';
  const couple = fields.couple ?? '';

  // Nothing scrolls under the cover until the guest taps.
  React.useEffect(() => {
    if (embedded || opened) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = prev;
    };
  }, [embedded, opened]);

  useGlide(opened && !editor && !embedded && !reduced);

  // The builder jumps to whichever section is being edited.
  React.useEffect(() => {
    if (!startAtStepId) return;
    const root = rootRef.current;
    const el = root?.querySelector<HTMLElement>(`[data-scene="${CSS.escape(startAtStepId)}"]`);
    if (!root || !el) return;
    const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';
    if (embedded) {
      const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
      root.scrollTo?.({ top, behavior });
    } else {
      el.scrollIntoView({ behavior, block: 'start' });
    }
  }, [startAtStepId, embedded, reduced, sections]);

  // "Reached the end" once the last section is on screen.
  const done = React.useRef(false);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;
  React.useEffect(() => {
    const root = rootRef.current;
    const all = root?.querySelectorAll('[data-scene]');
    const last = all?.[all.length - 1];
    if (!last || !opened || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting && !done.current) {
          done.current = true;
          onCompleteRef.current?.();
        }
      },
      { threshold: 0.4, root: embedded ? root : null },
    );
    io.observe(last);
    return () => io.disconnect();
  }, [opened, embedded, sections]);

  const stage: Stage = React.useMemo(
    () => ({ opened, editor, reduced, ar, embedded, root: rootRef, address }),
    [opened, editor, reduced, ar, embedded, address],
  );

  const coverP = cover ? coverProps({ ...cover, experience }) : null;
  const openNow = React.useCallback(() => {
    setOpened(true);
    setIntroGone(true);
    setMusic(true);
  }, []);

  return (
    <div
      ref={rootRef}
      dir={experience.direction}
      data-stage="bloom"
      data-testid="player-root"
      className={`${ar ? 'is-ar ' : ''}${
        embedded
          ? `relative h-full w-full overflow-x-clip ${opened ? 'overflow-y-auto' : 'overflow-y-hidden'}`
          : 'relative min-h-[100dvh] w-full overflow-x-clip'
      }`}
      style={{
        ...(embedded ? { containerType: 'size' as const } : {}),
        ['--bl-h' as string]: embedded ? '100cqh' : '100svh',
      }}
    >
      <link rel="stylesheet" href={BLOOM_FONTS_HREF} />
      <style>{BLOOM_CSS}</style>

      <StageContext.Provider value={stage}>
        <div className="bl-doc whitespace-pre-line">
          {/* In the builder the cover is the first section, drawn in place. */}
          {editor && cover && coverP ? (
            <div className="bl-cover-slot" data-scene={cover.step.templateStepId}>
              <Intro {...coverP} mode="inline" />
            </div>
          ) : null}
          {body.map(({ scene, step }) => {
            const src = { scene, step, experience };
            const l = LAYOUT[scene.id];
            const image = scene.background?.type === 'image' ? scene.background.imageUrl : undefined;
            const layout: Layout | null =
              l && image ? { ...l, art: image, color: scene.background?.colors?.[0] ?? '#eef1f1' } : null;
            const has = (k: string) => scene.slots.some((x) => x.key === k);
            let content: React.ReactNode;
            switch (scene.type) {
              case 'Quote':
                content = <Verse src={src} />;
                break;
              case 'Letter':
                content = <Invite src={src} />;
                break;
              case 'TextReveal':
                content = has('program') ? <Program src={src} /> : <SaveDate src={src} couple={couple} />;
                break;
              case 'Countdown':
                content = <Countdown src={src} />;
                break;
              case 'Venue':
                content = <Venue src={src} />;
                break;
              case 'Rsvp':
                content = <Rsvp src={src} />;
                break;
              case 'Finale':
                content = <ThankYou src={src} />;
                break;
              default:
                content = (
                  <SceneRenderer
                    scene={{ ...scene, ornament: { kind: 'none', opacity: 0, scale: 1 } }}
                    step={step}
                    theme={{ ...theme, ornament: { kind: 'none', opacity: 0, scale: 1 } }}
                    direction={experience.direction}
                    recipientName={experience.recipientName}
                    fields={experience.fields}
                    reducedMotion={reduced}
                    active={opened}
                  />
                );
            }
            return (
              <Panel key={step.templateStepId} id={step.templateStepId} layout={layout}>
                {content}
              </Panel>
            );
          })}
        </div>
      </StageContext.Provider>

      {/* The gate: the wreath over the card until the camera flies through. */}
      {!editor && !introGone && coverP ? (
        <Intro
          {...coverP}
          mode="live"
          contained={embedded}
          reduced={reduced}
          onStart={() => {
            setMusic(true);
            if (!embedded) track('card_opened');
          }}
          onOpen={() => {
            setOpened(true);
            window.setTimeout(() => setIntroGone(true), 1000);
          }}
        />
      ) : null}
      {!editor && !introGone && !coverP ? <OpenNow onOpen={openNow} /> : null}

      {!soundtrack ? null : embedded ? (
        <div className="pointer-events-none sticky bottom-0 z-30 h-0">
          <Soundtrack
            music={theme.music}
            src={experience.musicUrl}
            started={music}
            label={ar ? 'الموسيقى' : 'Music'}
            className="pointer-events-auto absolute bottom-token-4 end-token-4"
          />
        </div>
      ) : (
        <Soundtrack
          music={theme.music}
          src={experience.musicUrl}
          started={music}
          label={ar ? 'الموسيقى' : 'Music'}
          className="fixed bottom-token-4 end-token-4 z-30"
        />
      )}
    </div>
  );
}

function OpenNow({ onOpen }: { onOpen: () => void }) {
  React.useEffect(() => onOpen(), [onOpen]);
  return null;
}
