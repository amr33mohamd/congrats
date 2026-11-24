'use client';

/**
 * White Bloom: shared helpers and the opening (the wreath cover).
 *
 * Split from the player so the gallery thumbnail (TemplateStage) can draw the
 * real cover without pulling in the whole player.
 */
import * as React from 'react';
import { applyTokens, slotValue, type BoundExperience, type BoundStep, type SceneDef } from '@/lib/template-contract';
import { BLOOM_CSS } from './bloom-css';

export { BLOOM_CSS };

/** Every face the stage uses, with the italics Cormorant is set in. */
export const BLOOM_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500' +
  '&family=Great+Vibes&family=Marcellus&family=Playfair+Display:ital@0;1' +
  '&family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&family=El+Messiri:wght@400;500&display=swap';

export const WREATH = '/art/bloom/wreath.webp';

/* ───────────────────────────────── helpers ──────────────────────────────── */

export interface SlotSource {
  scene: SceneDef;
  step: BoundStep;
  experience: BoundExperience;
}

/** A slot's value with card fields and {recipient} resolved. */
export function text(c: SlotSource, key: string): string {
  const f = c.experience.fields ?? {};
  return applyTokens(slotValue(c.scene, c.step, key, f), c.experience.recipientName, f).trim();
}

const WALL = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

export interface WhenParts {
  dots: string;
  long: string;
  weekday: string;
  month: string;
  day: string;
  year: string;
  time: string;
  /** Google Calendar `dates` value. */
  gcal: string;
}

/**
 * A card date ("2027-02-12T19:00", wall-clock in the wedding's zone) split
 * into the pieces the sections show. Built from UTC parts and formatted in
 * UTC so the day never slips for a guest abroad.
 */
export function whenParts(raw: string, ar: boolean): WhenParts | null {
  const m = WALL.exec(raw.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const at = new Date(Date.UTC(+y, +mo - 1, +d, h ? +h : 12, mi ? +mi : 0));
  if (Number.isNaN(at.getTime())) return null;
  const loc = ar ? 'ar-EG' : 'en-GB';
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { timeZone: 'UTC', ...o }).format(at);
  const num = (n: number, digits: number) =>
    new Intl.NumberFormat(loc, { minimumIntegerDigits: digits, useGrouping: false }).format(n);
  const time = h
    ? new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-US', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' }).format(at)
    : '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = (t: Date, withTime: boolean) =>
    `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}` +
    (withTime ? `T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00` : '');
  const end = h ? new Date(at.getTime() + 5 * 3600_000) : new Date(at.getTime() + 86400_000);
  return {
    dots: `${num(+d, 2)} . ${num(+mo, 2)} . ${num(+y, 4)}`,
    long: `${fmt({ weekday: 'long' })} · ${fmt({ day: 'numeric', month: 'long', year: 'numeric' })}`,
    weekday: fmt({ weekday: 'long' }),
    month: fmt({ month: ar ? 'long' : 'short' }),
    day: num(+d, 1),
    year: num(+y, 4),
    time,
    gcal: `${stamp(at, Boolean(h))}/${stamp(end, Boolean(h))}`,
  };
}

/** "Omar & Nour" → ["Omar", "Nour"]; anything else → [names]. */
export function splitNames(names: string): string[] {
  const parts = names
    .split(/\s+(?:&|＆|\+|and|و)\s+|\s*&\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length === 2 ? parts : [names.trim()];
}

export function usePrefersReducedMotion(): boolean {
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

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** One particle on a keyframed path: [dx, dy, rotate, scale, opacity, offset]. */
export function fly(
  host: HTMLElement,
  cls: string,
  x0: number,
  y0: number,
  path: number[][],
  duration: number,
  delay: number,
  easing = 'linear',
): void {
  const p = document.createElement('i');
  p.className = cls;
  host.appendChild(p);
  if (!p.animate) {
    p.remove();
    return;
  }
  const frames = path.map((f) => ({
    transform: `translate(${(x0 + f[0]).toFixed(1)}px,${(y0 + f[1]).toFixed(1)}px) rotate(${f[2]}deg) scale(${f[3]})`,
    opacity: f[4],
    offset: f[5],
  }));
  p.animate(frames, { duration, delay, easing, fill: 'both' }).onfinish = () => p.remove();
}

/* ─────────────────────────────── the opening ────────────────────────────── */

// The wreath art and the clear oval inside it, in the art's own pixels.
const IW = 1080;
const IH = 1935;
const OV = { x: 545, y: 967, rx: 192, ry: 305 };

export interface IntroProps {
  kicker: string;
  names: string;
  dots: string;
  ar: boolean;
  /**
   * `live`: the gate over the card; a tap bursts the pearls, flies the camera
   * through the wreath and calls onOpen. `inline`: drawn in place (builder,
   * gallery thumbnail), already settled.
   */
  mode: 'live' | 'inline';
  /** Sit inside the player's frame (builder/admin preview) instead of over the page. */
  contained?: boolean;
  reduced?: boolean;
  /** The tap: start the music now (it needs the gesture). */
  onStart?: () => void;
  /** The camera is through the wreath: show the card. */
  onOpen?: () => void;
}

/**
 * The wreath cover. The art is laid out to the screen with the names centred
 * in its oval; the tap scatters pearls off the wreath (they fall with
 * gravity), drifts petals down from the top, then the camera flies through
 * the oval into a white veil and the card appears behind it.
 */
export function Intro({ kicker, names, dots, ar, mode, contained = false, reduced = false, onStart, onOpen }: IntroProps) {
  const scope = React.useRef<HTMLDivElement>(null);
  const bg = React.useRef<HTMLDivElement>(null);
  const ov = React.useRef<HTMLDivElement>(null);
  const cam = React.useRef<HTMLDivElement>(null);
  const fx = React.useRef<HTMLDivElement>(null);
  const geo = React.useRef({ cx: 0, cy: 0, rx: 0, ry: 0 });
  const [state, setState] = React.useState({ ready: mode === 'inline', shine: false, press: false, burst: false, fly: false, leave: false });
  const leaving = React.useRef(false);
  const [n1, n2] = (() => {
    const p = splitNames(names);
    return p.length === 2 ? p : [p[0], ''];
  })();

  // Lay the wreath out to the screen and the names into its oval.
  React.useLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    const layout = () => {
      const W = el.clientWidth || window.innerWidth;
      const H = el.clientHeight || window.innerHeight;
      const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
      const wide = W / H > 0.75;
      el.classList.toggle('is-wide', wide);
      const s = wide ? Math.max((H * 1.04) / IH, Math.min((W * 0.62) / IW, (H * 1.6) / IH)) : Math.max(W / IW, H / IH);
      let x = (W - IW * s) / 2;
      const y = clamp(H * 0.47 - OV.y * s, H - IH * s, 0);
      if (!wide) x = clamp(x, W - IW * s, 0);
      Object.assign(bg.current!.style, {
        left: `${x}px`,
        top: `${y}px`,
        width: `${IW * s}px`,
        height: `${IH * s}px`,
        backgroundImage: `url("${WREATH}")`,
      });
      const g = { cx: x + OV.x * s, cy: y + OV.y * s, rx: OV.rx * s, ry: OV.ry * s };
      geo.current = g;
      Object.assign(ov.current!.style, {
        left: `${g.cx - g.rx}px`,
        top: `${g.cy - g.ry}px`,
        width: `${g.rx * 2}px`,
        height: `${g.ry * 2}px`,
        fontSize: `${clamp(g.rx * 0.4, 30, 64)}px`,
      });
      cam.current!.style.transformOrigin = `${g.cx}px ${g.cy}px`;
      // Long names shrink until they fit the oval.
      ov.current!.querySelectorAll<HTMLElement>('.tpi-n1, .tpi-n2').forEach((n) => {
        n.style.fontSize = '';
        for (let i = 0; i < 14 && n.scrollWidth > ov.current!.clientWidth * 0.82; i++) {
          n.style.fontSize = `${parseFloat(getComputedStyle(n).fontSize) * 0.93}px`;
        }
      });
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    document.fonts?.ready.then(layout).catch(() => {});
    return () => ro.disconnect();
  }, [names, kicker, dots]);

  // Fade in once the art has loaded (or after 3 s regardless).
  React.useEffect(() => {
    if (mode !== 'live') return;
    let shineT = 0;
    const ready = () =>
      setState((s) => {
        if (s.ready) return s;
        shineT = window.setTimeout(() => !leaving.current && setState((t) => ({ ...t, shine: true })), 2600);
        return { ...s, ready: true };
      });
    const img = new window.Image();
    img.onload = ready;
    img.onerror = ready;
    img.src = WREATH;
    if (img.complete) ready();
    const t = window.setTimeout(ready, 3000);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(shineT);
    };
  }, [mode]);

  const burst = () => {
    const host = fx.current;
    const el = scope.current;
    if (!host || !el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const g = geo.current;
    // Pearls come off the wreath's outer edge (about twice the oval), go out
    // and up a little, then fall.
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + rnd(-0.12, 0.12);
      const k = rnd(1.25, 1.75);
      const x0 = g.cx + Math.cos(a) * g.rx * k;
      const y0 = g.cy + Math.sin(a) * g.ry * k;
      const dx = Math.cos(a) * rnd(0.25, 0.5) * W;
      const up = rnd(0.06, 0.16) * H;
      const fall = H - y0 + 40;
      const size = Math.random() < 0.35 ? ' s' : Math.random() < 0.5 ? ' m' : '';
      fly(
        host,
        `tpi-pl${size}`,
        x0,
        y0,
        [
          [0, 0, 0, 0.6, 0, 0],
          [dx * 0.35, -up, 0, 1, 1, 0.2],
          [dx * 0.7, -up * 0.4, 0, 1, 1, 0.45],
          [dx, fall * 0.55, 0, 1, 1, 0.78],
          [dx * 1.1, fall, 0, 1, 0.9, 1],
        ],
        rnd(1700, 2300),
        rnd(0, 160),
        'cubic-bezier(.3,.1,.6,1)',
      );
    }
    // Petals, turquoise and white, drifting down from the top.
    for (let i = 0; i < 26; i++) {
      const x = rnd(0.04, 0.96) * W;
      const sw = rnd(25, 60) * (Math.random() < 0.5 ? -1 : 1);
      const rot = rnd(-240, 240);
      const cls = `tpi-fl${Math.random() < 0.4 ? ' w' : ''}${Math.random() < 0.45 ? ' s' : ''}`;
      fly(
        host,
        cls,
        x,
        -24,
        [
          [0, 0, 0, 1, 0, 0],
          [sw, H * 0.3, rot * 0.3, 1, 1, 0.25],
          [-sw, H * 0.62, rot * 0.7, 1, 1, 0.65],
          [sw * 0.5, H + 30, rot, 1, 0.3, 1],
        ],
        rnd(2200, 2800),
        rnd(80, 600),
      );
    }
  };

  const finish = () => {
    if (mode !== 'live' || leaving.current) return;
    leaving.current = true;
    onStart?.();
    setState((s) => ({ ...s, ready: true, shine: false, press: true }));
    window.setTimeout(() => {
      setState((s) => ({ ...s, press: false, burst: true }));
      if (!reduced) burst();
    }, 180);
    window.setTimeout(() => setState((s) => ({ ...s, fly: true })), reduced ? 0 : 750);
    window.setTimeout(
      () => {
        setState((s) => ({ ...s, leave: true }));
        onOpen?.();
      },
      reduced ? 200 : 2500,
    );
  };

  const cls = [
    'tpi',
    mode === 'inline' || contained ? 'is-inline' : '',
    state.ready ? 'is-ready' : '',
    state.shine ? 'is-shine' : '',
    state.press ? 'is-press' : '',
    state.burst ? 'is-burst' : '',
    state.fly ? 'is-fly' : '',
    state.leave ? 'is-leave' : '',
    reduced ? 'is-still' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={scope}
      className={cls}
      role={mode === 'live' ? 'dialog' : undefined}
      aria-label={ar ? 'دعوة الفرح' : 'Wedding invitation'}
      onClick={finish}
    >
      <div ref={cam} className="tpi-cam" aria-hidden="true">
        <div ref={bg} className="tpi-bg" />
        <div ref={ov} className="tpi-ov">
          {kicker ? <p className="tpi-k">{kicker}</p> : null}
          <p className="tpi-n1">{n1}</p>
          {n2 ? (
            <>
              <p className="tpi-a">&amp;</p>
              <p className="tpi-n2">{n2}</p>
            </>
          ) : null}
          <div className="tpi-r">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          {dots ? (
            <p className="tpi-d" dir="ltr">
              {dots}
            </p>
          ) : null}
        </div>
      </div>
      <div ref={fx} className="tpi-fx" aria-hidden="true" />
      <div className="tpi-veil" aria-hidden="true" />
      <button
        className="tpi-btn"
        type="button"
        aria-label={ar ? 'افتح الدعوة' : 'Open the invitation'}
        tabIndex={mode === 'live' ? 0 : -1}
      >
        <i />
        {ar ? 'افتح الدعوة' : 'Tap to open'}
        <i />
      </button>
    </div>
  );
}

/** The cover's slots, read the same way everywhere. */
export function coverProps(c: SlotSource): Pick<IntroProps, 'kicker' | 'names' | 'dots' | 'ar'> {
  const ar = c.experience.direction === 'rtl';
  return {
    kicker: text(c, 'coverKicker'),
    names: text(c, 'heading'),
    dots: whenParts(text(c, 'date'), ar)?.dots ?? '',
    ar,
  };
}

/**
 * The cover as a still, for the gallery thumbnail: the same layout the guest
 * sees before tapping.
 */
export function BloomCoverStill({ scene, step, experience }: SlotSource) {
  const p = coverProps({ scene, step, experience });
  return (
    <div data-stage="bloom" className={`absolute inset-0 ${p.ar ? 'is-ar' : ''}`}>
      <style>{BLOOM_CSS}</style>
      <link rel="stylesheet" href={BLOOM_FONTS_HREF} />
      <Intro {...p} mode="inline" />
    </div>
  );
}
