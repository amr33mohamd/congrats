'use client';

/**
 * The Noir & Gold player (theme.stage === 'luxe-hall'): the whole invitation
 * is a 3D world instead of a scrolling card.
 *
 *  1. A black velvet ring box on a pedestal, the couple's monogram on its
 *     lid. The guest taps "open": the lid swings up, two gold rings and a
 *     diamond rise out, and the camera flies through them.
 *  2. A black-marble hall of gold arches, one arch per section of the card.
 *     The page still scrolls natively (so touch, wheel, keyboard and the
 *     builder's "jump to section" all just work); the scroll position only
 *     drives the camera, which pauses at each arch long enough to read it
 *     and then glides through.
 *  3. The last arch opens on the rings again, large, under the sign-off.
 *
 * The sections are the template's ordinary scenes, rendered by the same
 * SceneRenderer as every other card and projected into their arches each
 * frame by the 3D side (LuxeHall's Director). So editing, hiding a section,
 * photos, videos, darker text and RSVP buttons all behave exactly as on a
 * normal card. No WebGL → the normal scrolling card.
 */
import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  applyTokens,
  sceneForStep,
  slotValue,
  withLocaleFonts,
  type BoundStep,
  type SceneDef,
} from '@/lib/template-contract';
import { bodyFamily, cssFamily, googleFontsHref } from '@/lib/fonts';
import { track } from '@/lib/track';
import { SceneRenderer } from '../SceneRenderer';
import { Soundtrack } from '../Soundtrack';
import { CardPlayer, isSectionVisible, type PlayerProps } from '../Player';
import type { HallControl, PanelSlot } from './LuxeHall';

const LuxeHall = dynamic(() => import('./LuxeHall'), { ssr: false });

function alpha(hex: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  return `#${m[1]}${Math.round(a * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Scroll → which arch. Each arch holds for the middle half of its stretch of
 * scroll (the camera all but stops there to be read) and the camera glides
 * through the arch in the quarter on either side.
 */
function stationFor(fraction: number, count: number): number {
  const r = Math.max(0, Math.min(1, fraction)) * (count - 1);
  const i = Math.floor(r);
  const f = r - i;
  const g = f < 0.22 ? 0 : f > 0.78 ? 1 : (f - 0.22) / 0.56;
  return i + g * g * (3 - 2 * g);
}

/** "عمر & نور" → "ع & ن"; one name → its first letter. */
function initials(names: string): string {
  const parts = names
    .split(/\s*(?:&|＆|\+|\band\b|و\s)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const first = (p: string) => Array.from(p)[0] ?? '';
  if (parts.length >= 2) return `${first(parts[0])} & ${first(parts[1])}`;
  return first(names.trim()) || '♥';
}

export default function LuxePlayer(props: PlayerProps) {
  const [webgl, setWebgl] = React.useState<boolean | null>(null);
  React.useEffect(() => setWebgl(hasWebGL()), []);
  if (webgl === false) return <CardPlayer {...props} />;
  if (webgl === null) return <div className="h-full min-h-[100dvh] w-full bg-black" />;
  return <LuxeStage {...props} onFail={() => setWebgl(false)} />;
}

function LuxeStage({
  experience: given,
  startPaused = true,
  startAtStepId,
  onComplete,
  embedded = false,
  soundtrack = true,
  onFail,
}: PlayerProps & { onFail: () => void }) {
  const experience = React.useMemo(() => withLocaleFonts(given), [given]);
  const reduced = usePrefersReducedMotion();
  const ar = experience.locale === 'ar';
  const theme = experience.theme;
  const accent = theme.accent ?? '#D9B26F';
  const text = theme.textColor ?? '#F4EAD5';
  const fields = React.useMemo(() => experience.fields ?? {}, [experience.fields]);

  const sections = React.useMemo(() => {
    const out: Array<{ scene: SceneDef; step: BoundStep }> = [];
    for (const step of [...experience.steps].sort((a, b) => a.orderIndex - b.orderIndex)) {
      const scene = sceneForStep(experience, step);
      if (scene && isSectionVisible(scene, step, fields)) out.push({ scene, step });
    }
    return out;
  }, [experience, fields]);
  const count = Math.max(1, sections.length);

  const fontHref = React.useMemo(() => {
    const f = new Set<string | undefined>([theme.fontHeading, theme.fontBody]);
    for (const s of experience.scenes) if (s.style?.headingFont) f.add(s.style.headingFont);
    return googleFontsHref(Array.from(f));
  }, [theme.fontHeading, theme.fontBody, experience.scenes]);

  const cover = sections[0];
  const couple = cover
    ? applyTokens(slotValue(cover.scene, cover.step, 'heading', fields), experience.recipientName, fields)
    : '';
  const nameFont = cover?.scene.style?.headingFont ?? theme.fontHeading;
  const recipient = experience.recipientName.trim();

  const rootRef = React.useRef<HTMLDivElement>(null);
  const control = React.useRef<HallControl>({ target: 0, phase: startPaused ? 'closed' : 'hall', openedAt: 0 });
  const [phase, setPhase] = React.useState(control.current.phase);
  const panels = React.useRef<PanelSlot[]>([]);
  const [station, setStation] = React.useState(0);
  const [scrolled, setScrolled] = React.useState(false);
  // The box can only be opened once it exists. A slow network still gets a
  // working button after a while (the textures fill in when they arrive).
  const [ready, setReady] = React.useState(false);
  const onReady = React.useCallback(() => setReady(true), []);
  React.useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 9000);
    return () => window.clearTimeout(t);
  }, []);

  /* ── scroll drives the camera ─────────────────────────────────────── */
  const readFraction = React.useCallback(() => {
    if (embedded) {
      const el = rootRef.current;
      if (!el) return 0;
      return el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
    }
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  }, [embedded]);

  const completed = React.useRef(false);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;
  React.useEffect(() => {
    const target: HTMLElement | Window = embedded ? rootRef.current! : window;
    const on = () => {
      const st = stationFor(readFraction(), count);
      control.current.target = st;
      const i = Math.round(st);
      setStation(i);
      if (st > 0.05) setScrolled(true);
      if (i >= count - 1 && !completed.current) {
        completed.current = true;
        onCompleteRef.current?.();
      }
    };
    on();
    target.addEventListener('scroll', on, { passive: true });
    return () => target.removeEventListener('scroll', on);
  }, [embedded, readFraction, count]);

  // No scrolling until the box is open (the page would scroll a dark void).
  React.useEffect(() => {
    if (embedded || phase === 'hall') return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = prev;
    };
  }, [embedded, phase]);

  // The builder jumps to whichever section is being edited.
  React.useEffect(() => {
    if (!startAtStepId || phase !== 'hall') return;
    const i = sections.findIndex((s) => s.step.templateStepId === startAtStepId);
    if (i < 0) return;
    const frac = count > 1 ? i / (count - 1) : 0;
    if (embedded) {
      const el = rootRef.current;
      if (el) el.scrollTop = frac * (el.scrollHeight - el.clientHeight);
    } else {
      window.scrollTo({ top: frac * (document.documentElement.scrollHeight - window.innerHeight) });
    }
  }, [startAtStepId, phase, sections, count, embedded]);

  /* ── the panels: measured so a tall section shrinks to fit ─────────── */
  const setPanel = React.useCallback((i: number, el: HTMLDivElement | null) => {
    panels.current[i] = { el, fit: panels.current[i]?.fit ?? 1 };
  }, []);
  React.useEffect(() => {
    const ro = new ResizeObserver(() => {
      const h = rootRef.current?.clientHeight ?? window.innerHeight;
      const vh = embedded ? h : window.innerHeight;
      panels.current.forEach((p) => {
        if (!p?.el) return;
        const ph = p.el.offsetHeight;
        p.fit = ph > 0 ? Math.min(1, (vh * 0.84) / ph) : 1;
      });
    });
    panels.current.forEach((p) => p?.el && ro.observe(p.el));
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [sections, embedded]);

  const open = () => {
    if (control.current.phase !== 'closed') return;
    if (!embedded) track('card_opened');
    if (reduced) {
      control.current.phase = 'hall';
      setPhase('hall');
      return;
    }
    control.current.phase = 'opening';
    control.current.openedAt = performance.now() / 1000;
    setPhase('opening');
  };

  const headingFont = cssFamily(nameFont);
  const progress = ((station + 1) / count) * 100;
  const frameH = embedded ? 'h-[100cqh]' : 'h-[100dvh]';

  return (
    <div
      ref={rootRef}
      dir={experience.direction}
      className={embedded ? 'relative h-full w-full overflow-y-auto overflow-x-hidden' : 'relative w-full'}
      style={{
        background: '#060507',
        fontFamily: bodyFamily(theme.fontBody),
        ...(embedded ? { containerType: 'size' as const } : {}),
      }}
      data-testid="player-root"
      data-stage="luxe-hall"
    >
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}

      <div className={`sticky top-0 ${frameH} w-full overflow-hidden`}>
        <LuxeHall
          count={count}
          control={control}
          panels={panels}
          monogram={initials(couple)}
          monogramFont={`'${nameFont ?? 'serif'}', serif`}
          reduced={reduced}
          onIntroDone={() => {
            control.current.phase = 'hall';
            setPhase('hall');
          }}
          onError={onFail}
          onReady={onReady}
        />

        {/* the sections, projected into their arches by the Director */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-line" style={{ color: text }}>
          {sections.map(({ scene, step }, i) => {
            // Cover and sign-off float in the arch; the letter brings its own sheet.
            const bare = scene.type === 'Cover' || scene.type === 'Finale' || scene.type === 'Letter';
            return (
              <div
                key={step.templateStepId}
                ref={(el) => setPanel(i, el)}
                data-scene={step.templateStepId}
                className="absolute left-0 top-0 origin-center"
                style={{ width: 'min(88%, 430px)', visibility: 'hidden', willChange: 'transform, opacity' }}
              >
                <div
                  className={bare ? 'relative py-token-8' : 'relative overflow-hidden rounded-[28px] py-token-6'}
                  style={
                    bare
                      ? {
                          containerType: 'inline-size',
                          background: 'radial-gradient(closest-side, rgba(6,5,7,0.72), rgba(6,5,7,0))',
                        }
                      : {
                          containerType: 'inline-size',
                          background: 'linear-gradient(180deg, rgba(22,19,24,0.82), rgba(8,7,10,0.9))',
                          boxShadow: `0 0 0 1px ${alpha(accent, 0.45)}, inset 0 0 0 6px rgba(0,0,0,0.35), inset 0 0 0 7px ${alpha(accent, 0.18)}, 0 40px 90px -30px #000`,
                        }
                  }
                >
                  <SceneRenderer
                    scene={{ ...scene, ornament: { kind: 'none', opacity: 0, scale: 1 } }}
                    step={step}
                    theme={{ ...theme, ornament: { kind: 'none', opacity: 0, scale: 1 } }}
                    direction={experience.direction}
                    recipientName={experience.recipientName}
                    fields={experience.fields}
                    reducedMotion={reduced}
                    active={phase === 'hall' && i <= station + 1}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* reading position */}
        {phase === 'hall' ? (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[2px]">
            <div className="h-full transition-[width] duration-500" style={{ width: `${progress}%`, background: accent }} />
          </div>
        ) : null}

        {/* scroll hint until the guest first scrolls */}
        {phase === 'hall' && !scrolled && count > 1 ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-token-8 flex flex-col items-center gap-1 text-xs tracking-[0.2em]"
            style={{ color: accent }}
          >
            <span className="animate-bounce text-lg">⌃</span>
            <span>{ar ? 'اسحب لفوق' : 'SCROLL'}</span>
          </div>
        ) : null}

        {/* the gate: the guest's name and the tap that opens the box */}
        {phase !== 'hall' ? (
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col items-center px-token-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-24 text-center transition-opacity duration-700"
            style={{
              opacity: phase === 'opening' ? 0 : 1,
              pointerEvents: phase === 'opening' ? 'none' : 'auto',
              background: 'linear-gradient(to top, rgba(6,5,7,0.95) 30%, rgba(6,5,7,0))',
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.35em]" style={{ color: alpha(accent, 0.85) }}>
              {ar ? 'دعوة خاصة' : 'A private invitation'}
            </p>
            {couple ? (
              <p className="mt-token-2 text-4xl leading-[1.6]" style={{ color: accent, fontFamily: headingFont }}>
                {couple}
              </p>
            ) : null}
            {recipient ? (
              <p className="mt-token-1 text-sm" style={{ color: alpha(text, 0.8) }}>
                {ar ? `إلى ${recipient}` : `For ${recipient}`}
              </p>
            ) : null}
            <button
              type="button"
              onClick={open}
              disabled={!ready}
              aria-busy={!ready}
              className="mt-token-6 w-full max-w-xs rounded-pill px-token-8 py-token-4 text-base font-semibold tracking-wide transition-transform duration-300 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                color: '#1A1408',
                outlineColor: accent,
                background: `linear-gradient(110deg, #B8893F 0%, ${accent} 35%, #FFF1C9 50%, ${accent} 65%, #B8893F 100%)`,
                backgroundSize: '220% 100%',
                animation: reduced ? undefined : `luxe-sheen ${ready ? 3.2 : 1.2}s ease-in-out infinite`,
                opacity: ready ? 1 : 0.7,
                boxShadow: `0 10px 40px -10px ${alpha(accent, 0.7)}`,
              }}
            >
              {ready ? (ar ? 'افتح العلبة' : 'Open the box') : ar ? 'بنجهّز الدعوة…' : 'Preparing…'}
            </button>
            <style>{'@keyframes luxe-sheen{0%,100%{background-position:100% 0}50%{background-position:0 0}}'}</style>
          </div>
        ) : null}

        {soundtrack ? (
          <Soundtrack
            music={theme.music}
            src={experience.musicUrl}
            started={phase !== 'closed'}
            label={ar ? 'الموسيقى' : 'Music'}
            className="absolute bottom-token-4 end-token-4 z-10"
          />
        ) : null}
      </div>

      {/* the scroll the camera rides on: one screen per arch */}
      <div aria-hidden style={{ height: `calc(${count - 1} * ${embedded ? '100cqh' : '100dvh'} * 1.15)` }} />
    </div>
  );
}
