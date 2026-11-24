'use client';

/**
 * White Bloom: the card's sections, each with its own movement — the verse's
 * arch drawn as you scroll, the ribbon the guest unties, the date set in gems,
 * hanging pearls counting down, the program's line filling to each pearl, the
 * venue's arched map, the RSVP card under a brooch, and the thank-you oval
 * that rains pearls.
 *
 * Every section waits for the card to be opened (`opened`) and shows fully
 * settled in the builder (`editor`), where the sender edits what is under the
 * ribbon and along the line.
 */
import * as React from 'react';
import { remainingUntil } from '@/lib/countdown';
import { track } from '@/lib/track';
import { safeMapsUrl } from '../InvitationScenes';
import { fly, splitNames, text, whenParts, type SlotSource } from './parts';

/* ───────────────────────────────── the stage ────────────────────────────── */

export interface Stage {
  opened: boolean;
  editor: boolean;
  reduced: boolean;
  ar: boolean;
  embedded: boolean;
  /** The scrolling element when embedded; the window otherwise. */
  root: React.RefObject<HTMLDivElement | null>;
  /** The venue's address, for the calendar entry. */
  address: string;
}

export const StageContext = React.createContext<Stage | null>(null);
const useStage = () => React.useContext(StageContext)!;

/** The visible window: its top in client coordinates and its height. */
function viewport(s: Stage): { top: number; h: number } {
  if (s.embedded && s.root.current) {
    const r = s.root.current.getBoundingClientRect();
    return { top: r.top, h: s.root.current.clientHeight };
  }
  return { top: 0, h: window.innerHeight || 800 };
}

/** Run `fn` (once a frame at most) whenever the card scrolls or resizes. */
function useOnScroll(fn: () => void, deps: React.DependencyList) {
  const s = useStage();
  const ref = React.useRef(fn);
  ref.current = fn;
  React.useEffect(() => {
    let raf = 0;
    const ask = () => {
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), ref.current()));
    };
    const target: HTMLElement | Window = s.embedded && s.root.current ? s.root.current : window;
    target.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask);
    ask();
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener('scroll', ask);
      window.removeEventListener('resize', ask);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.embedded, ...deps]);
}

/** Has `ref` been at least `threshold` on screen (sticky once true). */
function useSeen(ref: React.RefObject<Element | null>, threshold: number, sticky = true): boolean {
  const s = useStage();
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        const on = es[0].isIntersecting;
        if (on || !sticky) setSeen(on);
      },
      { threshold, root: s.embedded ? s.root.current : null },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, sticky, s.embedded, s.root]);
  return seen;
}

/** An id safe inside an SVG url(#…). */
const useSvgId = (p: string) => `${p}${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;

/* ─────────────────────────────── the panels ─────────────────────────────── */

export interface Layout {
  art: string;
  color: string;
  /** Where the flowers are, so the art is pinned there and never cropped. */
  position: 'left top' | 'right top' | 'left bottom' | 'right bottom';
  /** Padding on the flowers' side: min(max px, k × column width). */
  max: number;
  k: number;
}

/** Each section's panel, keyed by scene id; anything else gets a plain ground. */
export const LAYOUT: Record<string, Omit<Layout, 'art' | 'color'>> = {
  verse: { position: 'left top', max: 330, k: 0.6 },
  invite: { position: 'right top', max: 270, k: 0.48 },
  savedate: { position: 'right bottom', max: 390, k: 0.76 },
  countdown: { position: 'left bottom', max: 420, k: 0.82 },
  program: { position: 'left top', max: 440, k: 0.84 },
  venue: { position: 'right top', max: 270, k: 0.48 },
  rsvp: { position: 'right bottom', max: 330, k: 0.64 },
  finale: { position: 'left bottom', max: 330, k: 0.64 },
};

export function Panel({
  id,
  layout,
  children,
}: {
  id: string;
  layout: Layout | null;
  children: React.ReactNode;
}) {
  const side = layout ? (layout.position.endsWith('top') ? 'top' : 'bottom') : '';
  return (
    <section
      data-scene={id}
      className={`bl-sec ${side ? `flowers-${side}` : ''}`}
      style={
        layout
          ? ({
              backgroundColor: layout.color,
              backgroundImage: `url("${layout.art}")`,
              backgroundPosition: layout.position,
              ['--bl-flowers' as string]: `min(${layout.max}px, ${Math.round(layout.k * 100)}cqw)`,
            } as React.CSSProperties)
          : { backgroundColor: '#eef1f1' }
      }
    >
      <div className="bl-in">{children}</div>
    </section>
  );
}

/* ───────────────────────────────── the verse ────────────────────────────── */

/** Points along a pointed arch: two circle arcs from the legs to the apex. */
function archPts(W: number, m: number, A: number, n: number) {
  const span = W - 2 * m;
  const r = span * 0.75;
  const pts: number[][] = [];
  const cxL = m + r;
  const aEnd = Math.acos((W / 2 - cxL) / r);
  for (let i = 0; i <= n; i++) {
    const a = Math.PI - ((Math.PI - aEnd) * i) / n;
    pts.push([cxL + r * Math.cos(a), A - r * Math.sin(a)]);
  }
  for (let i = n - 1; i >= 0; i--) pts.push([W - pts[i][0], pts[i][1]]);
  return pts;
}

export function Verse({ src }: { src: SlotSource }) {
  const s = useStage();
  const scope = React.useRef<HTMLDivElement>(null);
  const frame = React.useRef<HTMLDivElement>(null);
  const inner = React.useRef<HTMLDivElement>(null);
  const bism = React.useRef<HTMLParagraphElement>(null);
  const drawn = React.useRef({ paths: [] as SVGPathElement[], pearls: [] as SVGCircleElement[], lens: [] as number[], last: -1 });
  const pearlId = useSvgId('tpaPearl');
  const b = text(src, 'bismillah');
  const tr = s.ar ? '' : text(src, 'translation');
  const ayah = text(src, 'verse');
  const ref = text(src, 'verseRef');

  const draw = React.useCallback((p: number) => {
    const d = drawn.current;
    if (Math.abs(p - d.last) < 0.002) return;
    d.last = p;
    d.paths.forEach((el, i) => (el.style.strokeDashoffset = (d.lens[i] * (1 - p)).toFixed(1)));
    // The line starts at the left leg; each pearl shows as the line reaches it.
    d.pearls.forEach((c) => c.classList.toggle('on', p >= 0.14 + parseFloat(c.dataset.at ?? '0') * 0.62));
  }, []);

  const progress = React.useCallback(() => {
    const el = scope.current;
    if (!el) return;
    if (s.editor) return draw(1);
    const v = viewport(s);
    const r = el.getBoundingClientRect();
    const top = r.top - v.top;
    const a = v.h * 0.9;
    const b2 = v.h * 0.55;
    const p = s.opened ? (a - top) / (a - b2 + r.height * 0.55) : 0;
    draw(Math.max(0, Math.min(1, p)));
  }, [s, draw]);

  // Build the arch to the size of the words.
  React.useEffect(() => {
    const el = scope.current;
    if (!el) return;
    let lastW = 0;
    let lastH = 0;
    const build = () => {
      const W = el.clientWidth;
      if (!W || !frame.current || !inner.current) return;
      const m = 6;
      const span = W - 2 * m;
      const archH = span * 0.707;
      inner.current.style.paddingTop = `${Math.round(archH * 0.5)}px`;
      // The bismillah stays on one line.
      if (bism.current) {
        const bs = bism.current;
        bs.style.fontSize = '';
        let f = parseFloat(getComputedStyle(bs).fontSize) || 28;
        for (let i = 0; i < 12 && bs.scrollWidth > inner.current.clientWidth * 0.84; i++) {
          f *= 0.94;
          bs.style.fontSize = `${f}px`;
        }
      }
      const H = el.clientHeight;
      if (Math.abs(W - lastW) < 1 && Math.abs(H - lastH) < 1 && frame.current.querySelector('svg')) return;
      lastW = W;
      lastH = H;
      const A = m + archH;
      const base = H - m;
      const r = span * 0.75;
      const dO = `M${m} ${base}L${m} ${A}A${r} ${r} 0 0 1 ${W / 2} ${A - archH}A${r} ${r} 0 0 1 ${W - m} ${A}L${W - m} ${base}Z`;
      // The inner line: the same arch 11px in, scalloped between its points.
      const g = 11;
      const mi = m + g;
      const inn = archPts(W, mi, A + g * 0.4, 6);
      let dI = `M${mi} ${base - g}L${inn[0][0].toFixed(1)} ${inn[0][1].toFixed(1)}`;
      for (let i = 1; i < inn.length; i++) {
        const p = inn[i];
        const q = inn[i - 1];
        const c = Math.hypot(p[0] - q[0], p[1] - q[1]) * 0.56;
        dI += `A${c.toFixed(1)} ${c.toFixed(1)} 0 0 0 ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
      }
      dI += `L${W - mi} ${base - g}Z`;
      let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><radialGradient id="${pearlId}" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#f1ede6"/><stop offset="1" stop-color="#a99f92"/></radialGradient></defs>`;
      svg += `<path class="ln o" d="${dO}"/><path class="ln" d="${dI}"/>`;
      // A pearl at every scallop, a bigger one over the apex.
      inn.forEach((p, i) => {
        if (i === 0 || i === inn.length - 1) return;
        const big = i === 6;
        svg += `<circle class="pl" data-at="${(i / inn.length).toFixed(3)}" cx="${p[0].toFixed(1)}" cy="${(p[1] - (big ? 9 : 0)).toFixed(1)}" r="${big ? 5.5 : 3.2}" fill="url(#${pearlId})"/>`;
      });
      frame.current.innerHTML = `${svg}</svg>`;
      const paths = Array.from(frame.current.querySelectorAll<SVGPathElement>('path'));
      const lens = paths.map((p) => {
        const L = p.getTotalLength ? p.getTotalLength() : 3000;
        p.style.strokeDasharray = `${L} ${L}`;
        return L;
      });
      drawn.current = { paths, lens, pearls: Array.from(frame.current.querySelectorAll<SVGCircleElement>('circle')), last: -1 };
      progress();
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(el);
    if (inner.current) ro.observe(inner.current);
    document.fonts?.ready.then(() => ((lastW = 0), build())).catch(() => {});
    return () => ro.disconnect();
  }, [pearlId, progress, b, tr, ayah, ref]);

  useOnScroll(progress, [progress]);

  return (
    <div ref={scope} className={`tpa ${s.opened ? 'is-live' : ''}`}>
      <div ref={frame} className="tpa-frame" aria-hidden="true" />
      <div ref={inner} className="tpa-in">
        <div className="tpa-gem" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        {b ? (
          <p ref={bism} className="tpa-bism">
            {b}
          </p>
        ) : null}
        {tr ? <p className="tpa-tr">{tr}</p> : null}
        <div className="tpa-rule" aria-hidden="true">
          <i />
          <b />
          <i />
        </div>
        {ayah ? <p className="tpa-ayah">{ayah}</p> : null}
        {ref ? <p className="tpa-ref">{ref}</p> : null}
      </div>
    </div>
  );
}

/* ───────────────────────────── the invitation card ──────────────────────── */

/** A gold ring set with ten pearls and a large one in the middle. */
function Brooch({ teal = false }: { teal?: boolean }) {
  const p = useSvgId('bP');
  const g = useSvgId('bG');
  const t = useSvgId('bT');
  return (
    <svg viewBox="0 0 78 78" aria-hidden="true">
      <defs>
        <radialGradient id={p} cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#f3efe8" />
          <stop offset="1" stopColor="#a99f92" />
        </radialGradient>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1dfae" />
          <stop offset=".5" stopColor="#b8975a" />
          <stop offset="1" stopColor="#7d6232" />
        </linearGradient>
        <radialGradient id={t} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#2aa3ad" />
          <stop offset="1" stopColor="#07414b" />
        </radialGradient>
      </defs>
      {teal ? <circle cx="39" cy="39" r="33" fill={`url(#${t})`} /> : <circle cx="39" cy="40.5" r="34" fill="#06343c" opacity=".18" />}
      <circle cx="39" cy="39" r="27" fill="none" stroke={`url(#${g})`} strokeWidth="3" />
      <circle cx="39" cy="39" r="18" fill="none" stroke={`url(#${g})`} strokeWidth="1.2" />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={(39 + Math.cos(a) * 27).toFixed(2)} cy={(39 + Math.sin(a) * 27).toFixed(2)} r="6.2" fill={`url(#${p})`} />;
      })}
      <circle cx="39" cy="39" r="12.5" fill={`url(#${p})`} />
      <ellipse cx="35" cy="34.5" rx="4" ry="2.4" fill="#fff" opacity=".8" transform="rotate(-30 35 34.5)" />
    </svg>
  );
}

export function Invite({ src }: { src: SlotSource }) {
  const s = useStage();
  const card = React.useRef<HTMLDivElement>(null);
  const [press, setPress] = React.useState(false);
  const [open, setOpen] = React.useState(s.editor);
  const seen = useSeen(card, 0, false);
  React.useEffect(() => {
    if (s.editor) setOpen(true);
  }, [s.editor]);
  const names = splitNames(text(src, 'names'));
  const when = whenParts(text(src, 'date'), s.ar);
  const untie = () => {
    if (open || s.editor) return;
    setPress(true);
    window.setTimeout(() => {
      setPress(false);
      setOpen(true);
    }, 150);
  };
  const cls = ['tpv', open ? 'is-open' : '', press ? 'is-press' : '', s.opened && seen ? 'is-live' : '', s.reduced ? 'is-still' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      <div
        ref={card}
        className="tpv-card"
        role="button"
        tabIndex={0}
        aria-label={s.ar ? 'فك الشريطة وافتح الدعوة' : 'Untie the ribbon to open the invitation'}
        onClick={untie}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            untie();
          }
        }}
      >
        <div className="tpv-txt">
          <p className="tpv-k">{text(src, 'inviteKicker')}</p>
          <p className="tpv-n">{names[0]}</p>
          {names[1] ? (
            <>
              <p className="tpv-a">&amp;</p>
              <p className="tpv-n">{names[1]}</p>
            </>
          ) : null}
          <div className="tpv-r" aria-hidden="true">
            <b />
            <i />
            <i />
            <i />
            <b />
          </div>
          <p className="tpv-p">{text(src, 'inviteBody')}</p>
          {when ? <p className="tpv-d">{when.long}</p> : null}
          <p className="tpv-t">{text(src, 'inviteTime')}</p>
        </div>
        <div className="tpv-rb" aria-hidden="true">
          <i className="t1" />
          <i className="t2" />
          <i className="v1" />
          <i className="v2" />
          <i className="h1" />
          <i className="h2" />
        </div>
        <span className="tpv-br" aria-hidden="true">
          <Brooch />
        </span>
      </div>
      <p className="tpv-hint" aria-hidden="true">
        <i />
        {s.ar ? 'اضغط لفك الشريطة' : 'Tap to untie'}
        <i />
      </p>
    </div>
  );
}

/* ───────────────────────────── save the date ────────────────────────────── */

export function SaveDate({ src, couple }: { src: SlotSource; couple: string }) {
  const s = useStage();
  const row = React.useRef<HTMLDivElement>(null);
  const seen = useSeen(row, 0.35);
  const when = whenParts(text(src, 'date'), s.ar);
  const live = s.editor || (s.opened && seen);
  const calendar = when
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        s.ar ? `فرح ${couple}` : `${couple}'s Wedding`,
      )}&dates=${when.gcal}&ctz=Africa/Cairo${s.address ? `&location=${encodeURIComponent(s.address.replace(/\n/g, ', '))}` : ''}`
    : '';
  return (
    <div className={`tpd ${live ? 'is-live' : ''} ${s.reduced ? 'is-still' : ''}`}>
      <p className="tpd-h">{text(src, 'saveHeading')}</p>
      <p className="tpd-sub">{text(src, 'saveBody')}</p>
      {when ? (
        <>
          <div ref={row} className="tpd-row" aria-hidden="true" dir="ltr">
            <i className="tpd-line" />
            <i className="tpd-pl a" />
            <i className="tpd-pl b" />
            <div className="tpd-gem l">
              <b />
              <span className="tpd-mo">{when.month}</span>
            </div>
            <div className="tpd-gem c">
              <b />
              <span className="tpd-dy">{when.day}</span>
              <i className="tpd-drop" />
            </div>
            <div className="tpd-gem r">
              <b />
              <span className="tpd-yr">{when.year}</span>
            </div>
          </div>
          <div className="tpd-when">
            <span>{when.weekday}</span>
            {when.time ? (
              <>
                <i />
                <span>{when.time}</span>
              </>
            ) : null}
          </div>
          <a className="tpd-add" href={calendar} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            <i />
            {s.ar ? 'أضف للتقويم' : 'Add to Calendar'}
            <i />
          </a>
        </>
      ) : null}
    </div>
  );
}

/* ───────────────────────────────── countdown ────────────────────────────── */

export function Countdown({ src }: { src: SlotSource }) {
  const s = useStage();
  const scope = React.useRef<HTMLDivElement>(null);
  const seen = useSeen(scope, 0.2, false);
  const [inOnce, setIn] = React.useState(false);
  const live = s.opened && seen;
  const target = text(src, 'date');
  const [left, setLeft] = React.useState(() => remainingUntil(target));
  React.useEffect(() => {
    setLeft(remainingUntil(target));
    if (!live) return;
    setIn(true);
    const id = window.setInterval(() => setLeft(remainingUntil(target)), 1000);
    return () => window.clearInterval(id);
  }, [live, target]);
  const loc = s.ar ? 'ar-EG' : 'en-GB';
  const v = left ? [left.d, left.h, left.m, left.s] : [0, 0, 0, 0];
  const fmt = (n: number, i: number) =>
    new Intl.NumberFormat(loc, { minimumIntegerDigits: i === 0 && n > 99 ? 1 : 2, useGrouping: false }).format(n);
  const labels = s.ar ? ['يوم', 'ساعة', 'دقيقة', 'ثانية'] : ['Days', 'Hours', 'Minutes', 'Seconds'];
  return (
    <div
      ref={scope}
      className={['tpc', live ? 'is-live' : '', inOnce || s.editor ? 'is-in' : '', s.reduced ? 'is-still' : ''].filter(Boolean).join(' ')}
    >
      <p className="tpc-k">{text(src, 'countKicker')}</p>
      <p className="tpc-h">{text(src, 'countHeading')}</p>
      <div className="tpc-bar" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="tpc-row" dir={s.ar ? 'rtl' : 'ltr'}>
        {v.map((n, i) => (
          <div key={labels[i]} className="tpc-u">
            <i className="tpc-ch" />
            <i className="tpc-cap" />
            <div className="tpc-pearl">
              <span className="tpc-n">{fmt(n, i)}</span>
            </div>
            <p className="tpc-l">{labels[i]}</p>
          </div>
        ))}
      </div>
      <p className="tpc-note">{text(src, 'countNote')}</p>
    </div>
  );
}

/* ───────────────────────────────── the program ──────────────────────────── */

export function Program({ src }: { src: SlotSource }) {
  const s = useStage();
  const scope = React.useRef<HTMLDivElement>(null);
  const tl = React.useRef<HTMLDivElement>(null);
  const fill = React.useRef<HTMLElement>(null);
  const [on, setOn] = React.useState<boolean[]>([]);
  const [end, setEnd] = React.useState(false);
  const items = text(src, 'program')
    .split('\n')
    .map((l) => l.split('|').map((x) => x.trim()))
    .filter((p) => p.some(Boolean));

  // The gold line fills down to 62% of the screen; each pearl lights as it passes.
  const update = React.useCallback(() => {
    const line = tl.current;
    if (!line) return;
    const v = viewport(s);
    const r = line.getBoundingClientRect();
    const len = Math.max(1, r.height - 34);
    const reach = s.editor ? len : s.opened ? v.h * 0.62 - (r.top - v.top) : 0;
    const p = Math.max(0, Math.min(1, reach / len));
    if (fill.current) fill.current.style.transform = `scaleY(${p.toFixed(4)})`;
    const dots = Array.from(line.querySelectorAll<HTMLElement>('.tpp-dot'));
    const next = dots.map((d) => reach >= d.getBoundingClientRect().top + 8 - r.top);
    setOn((prev) => (prev.length === next.length && prev.every((x, i) => x === next[i]) ? prev : next));
    setEnd(p >= 0.995);
  }, [s]);
  useOnScroll(update, [update, items.length]);

  return (
    <div ref={scope} className={`tpp ${end ? 'is-end' : ''}`}>
      <p className="tpp-k">{text(src, 'progKicker')}</p>
      <p className="tpp-h">{text(src, 'progHeading')}</p>
      <div ref={tl} className="tpp-tl">
        <i className="tpp-track" aria-hidden="true" />
        <i ref={fill} className="tpp-fill" aria-hidden="true" />
        {items.map(([time, title, note], i) => (
          <div key={i} className={`tpp-it ${on[i] ? 'on' : ''}`}>
            <i className="tpp-dot" aria-hidden="true" />
            <div className="tpp-t">
              {time ? <p className="tpp-time">{time}</p> : null}
              {title ? <p className="tpp-ti">{title}</p> : null}
              {note ? <p className="tpp-de">{note}</p> : null}
            </div>
          </div>
        ))}
        <i className="tpp-end" aria-hidden="true" />
      </div>
    </div>
  );
}

/* ───────────────────────────────── the venue ────────────────────────────── */

function MapPin() {
  const p = useSvgId('pP');
  const t = useSvgId('pT');
  return (
    <svg viewBox="0 0 30 42" aria-hidden="true">
      <defs>
        <radialGradient id={p} cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#f3efe8" />
          <stop offset="1" stopColor="#a99f92" />
        </radialGradient>
        <linearGradient id={t} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3fb3bb" />
          <stop offset="1" stopColor="#0a4b55" />
        </linearGradient>
      </defs>
      <path d="M15 41C15 41 3 25 3 16a12 12 0 0 1 24 0c0 9-12 25-12 25z" fill={`url(#${t})`} stroke="#e2c98f" strokeWidth="1.2" />
      <circle cx="15" cy="15.5" r="7.6" fill={`url(#${p})`} />
      <ellipse cx="12.6" cy="12.8" rx="2.4" ry="1.4" fill="#fff" opacity=".85" transform="rotate(-30 12.6 12.8)" />
    </svg>
  );
}

export function Venue({ src }: { src: SlotSource }) {
  const s = useStage();
  const address = text(src, 'address');
  const [hall, ...rest] = address.split('\n');
  const given = text(src, 'mapUrl');
  const query = encodeURIComponent(address.replace(/\n/g, ', '));
  const href = safeMapsUrl(given) ? given : address ? `https://www.google.com/maps/search/?api=1&query=${query}` : '';
  return (
    <div className="bl-venue">
      <div className="lb-inner">
        <p className="lb-eyebrow">{s.ar ? 'المكان' : 'Location'}</p>
        <h2 className="lb-heading">{text(src, 'heading')}</h2>
        {hall ? <p className="lb-venue">{hall}</p> : null}
        {rest.length ? <p className="lb-address">{rest.join('\n')}</p> : null}
        {address ? (
          <div className="lb-map">
            <iframe
              title={s.ar ? 'الخريطة' : 'Map'}
              src={`https://www.google.com/maps?q=${query}&z=15&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <span className="tpl-pin">
              <MapPin />
            </span>
          </div>
        ) : null}
        {href ? (
          <a
            className="lb-btn lb-btn--solid"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              if (/^\/(ar|en)\/p\//.test(window.location.pathname)) track('directions_click');
            }}
          >
            {s.ar ? 'افتح الخريطة' : 'Get Directions'}
          </a>
        ) : null}
      </div>
    </div>
  );
}

/* ───────────────────────────────── the RSVP ─────────────────────────────── */

function cardSlug(): string | null {
  return /^\/(?:ar|en)\/p\/([^/?#]+)/.exec(window.location.pathname)?.[1] ?? null;
}

export function Rsvp({ src }: { src: SlotSource }) {
  const s = useStage();
  const ar = s.ar;
  const [name, setName] = React.useState('');
  const [attending, setAttending] = React.useState<boolean | null>(null);
  const [guests, setGuests] = React.useState(1);
  const [note, setNote] = React.useState('');
  const [state, setState] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const phone = text(src, 'phone').replace(/[^\d]/g, '');
  const guest = src.experience.recipientName || (ar ? 'ضيفكم' : 'your guest');
  const wa =
    phone.length >= 8
      ? `https://wa.me/${phone}?text=${encodeURIComponent(ar ? `أهلاً! أنا ${guest}، يسعدني أؤكد حضوري 🤍` : `Hi! It's ${guest} — delighted to confirm I'll be there 🤍`)}`
      : '';

  // Someone who already answered on this phone sees that, not the form.
  React.useEffect(() => {
    const slug = cardSlug();
    if (!slug) return;
    try {
      if (window.localStorage.getItem(`rsvp:${slug}`)) setState('sent');
    } catch {
      /* storage blocked — show the form */
    }
  }, []);

  const valid = name.trim().length >= 2 && attending !== null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || state === 'sending') return;
    const slug = cardSlug();
    if (!slug) {
      // Builder / admin preview: show the result without saving.
      setState('sent');
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, name: name.trim(), attending, guests: attending ? guests : 0, note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error(String(res.status));
      try {
        window.localStorage.setItem(`rsvp:${slug}`, attending ? 'yes' : 'no');
      } catch {
        /* the reply is saved anyway */
      }
      track('rsvp_click');
      setState('sent');
    } catch {
      setState('error');
    }
  };

  const L = ar
    ? { name: 'الاسم بالكامل', will: 'هتشرّفنا؟', yes: 'أكيد جاي', no: 'للأسف مش هقدر', count: 'عدد الأفراد', note: 'كلمة للعروسين', send: 'ابعت الرد', sending: 'بيتبعت…', sent: 'تم ✓', ok: 'شكراً، وصلنا ردك 🤍', err: 'محصلش إرسال، جرّب تاني.' }
    : { name: 'Full Name', will: 'Will you attend?', yes: 'Joyfully Accept', no: 'Regretfully Decline', count: 'Number of Guests', note: 'A Note for the Couple', send: 'Send RSVP', sending: 'Sending…', sent: 'Sent ✓', ok: 'Thank you — your reply has been received.', err: "Couldn't send — please try again." };

  return (
    <div className="bl-rsvp">
      <div className="lb-inner">
        <p className="lb-eyebrow">{ar ? 'تأكيد الحضور' : 'RSVP'}</p>
        <h2 className="lb-heading">{text(src, 'heading')}</h2>
        {text(src, 'body') ? <p className="lb-body">{text(src, 'body')}</p> : null}
        <div className="lb-card lb-rsvp" onClick={(e) => e.stopPropagation()}>
          {state === 'sent' ? (
            <p className="lb-form-msg" role="status">
              {L.ok}
            </p>
          ) : (
            <form className="lb-form" onSubmit={submit} dir={ar ? 'rtl' : 'ltr'}>
              <label className="lb-field">
                <span>{L.name}</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" required />
              </label>
              <div className="lb-field" role="radiogroup" aria-label={L.will}>
                <span>{L.will}</span>
                <div className="lb-choices">
                  {[true, false].map((v) => (
                    <label key={String(v)}>
                      <input type="radio" name="attending" checked={attending === v} onChange={() => setAttending(v)} />
                      {v ? L.yes : L.no}
                    </label>
                  ))}
                </div>
              </div>
              {attending ? (
                <label className="lb-field">
                  <span>{L.count}</span>
                  <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {new Intl.NumberFormat(ar ? 'ar-EG' : 'en-GB').format(n)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="lb-field">
                <span>{L.note}</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
              </label>
              <button type="submit" className="lb-btn lb-btn--solid" disabled={!valid || state === 'sending'}>
                {state === 'sending' ? L.sending : L.send}
              </button>
              {state === 'error' ? (
                <p className="lb-form-note" role="alert">
                  {L.err}
                </p>
              ) : null}
            </form>
          )}
          <span className="tpr-br" aria-hidden="true">
            <Brooch teal />
          </span>
        </div>
        {wa && state !== 'sent' ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="lb-body" style={{ textDecoration: 'underline', fontSize: 15 }}>
            {ar ? 'أو أكّد على واتساب' : 'Or reply on WhatsApp'}
          </a>
        ) : null}
      </div>
    </div>
  );
}

/* ───────────────────────────────── thank you ────────────────────────────── */

export function ThankYou({ src }: { src: SlotSource }) {
  const s = useStage();
  const ov = React.useRef<HTMLDivElement>(null);
  const fx = React.useRef<HTMLDivElement>(null);
  const lines = React.useRef<SVGEllipseElement[]>([]);
  const busy = React.useRef(0);
  const rained = React.useRef(false);
  const seen = useSeen(ov, 0.4);
  const live = s.editor || (s.opened && seen);
  const pearlId = useSvgId('tzP');
  const when = whenParts(text(src, 'date'), s.ar);
  const names = splitNames(text(src, 'names'));

  // The two ovals draw themselves once the section is on screen.
  React.useEffect(() => {
    lines.current.forEach((l) => {
      if (!l) return;
      const L = l.getTotalLength ? l.getTotalLength() : 1100;
      l.style.strokeDasharray = `${L} ${L}`;
      l.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(.4, 0, .2, 1)';
      l.style.strokeDashoffset = live ? '0' : String(L);
    });
  }, [live]);

  // The names stay on one line inside the oval.
  React.useEffect(() => {
    const o = ov.current;
    if (!o) return;
    const fit = () =>
      o.querySelectorAll<HTMLElement>('.tpz-h, .tpz-n').forEach((el) => {
        el.style.fontSize = '';
        for (let i = 0; i < 12 && el.scrollWidth > o.clientWidth * 0.72; i++) {
          el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * 0.93}px`;
        }
      });
    fit();
    document.fonts?.ready.then(fit).catch(() => {});
  });

  const rain = React.useCallback(() => {
    const host = fx.current;
    const o = ov.current;
    if (!host || !o || s.reduced || busy.current > 40) return;
    const W = o.clientWidth;
    const H = o.clientHeight;
    for (let i = 0; i < 18; i++) {
      busy.current++;
      const x = (0.18 + Math.random() * 0.64) * W;
      const floor = H * (0.86 + Math.random() * 0.07);
      const sw = -14 + Math.random() * 28;
      fly(
        host,
        `tpz-pl${Math.random() < 0.45 ? ' s' : ''}`,
        0,
        0,
        [
          [x, -12, 0, 1, 0, 0],
          [x + sw * 0.5, floor * 0.5, 0, 1, 1, 0.35],
          [x + sw, floor, 0, 1, 1, 0.7],
          [x + sw * 1.2, floor - 16, 0, 1, 1, 0.82],
          [x + sw * 1.3, floor, 0, 1, 0.9, 0.92],
          [x + sw * 1.3, floor, 0, 1, 0, 1],
        ],
        1900 + Math.random() * 600,
        Math.random() * 700,
        'cubic-bezier(.45,.05,.55,.95)',
      );
      window.setTimeout(() => busy.current--, 3300);
    }
  }, [s.reduced]);

  // The first time it is seen, a few pearls fall once the oval is drawn.
  React.useEffect(() => {
    if (!live || s.editor || rained.current) return;
    rained.current = true;
    const t = window.setTimeout(rain, 1600);
    return () => window.clearTimeout(t);
  }, [live, s.editor, rain]);

  return (
    <div className={`tpz ${live ? 'is-live' : ''} ${s.reduced ? 'is-still' : ''}`}>
      <div ref={ov} className="tpz-ov" onClick={() => !s.editor && rain()}>
        <div className="tpz-fr" aria-hidden="true">
          <svg viewBox="0 0 300 400">
            <defs>
              <radialGradient id={pearlId} cx="35%" cy="30%" r="70%">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset=".45" stopColor="#f1ede6" />
                <stop offset="1" stopColor="#a99f92" />
              </radialGradient>
            </defs>
            <ellipse ref={(el) => void (lines.current[0] = el!)} className="ln g" cx="150" cy="200" rx="147" ry="197" />
            <ellipse ref={(el) => void (lines.current[1] = el!)} className="ln t" cx="150" cy="200" rx="128" ry="176" />
            {Array.from({ length: 44 }, (_, i) => {
              const a = -Math.PI / 2 + (i / 44) * Math.PI * 2;
              return (
                <circle
                  key={i}
                  className="pl"
                  cx={(150 + Math.cos(a) * 137.5).toFixed(1)}
                  cy={(200 + Math.sin(a) * 186.5).toFixed(1)}
                  r={i % 11 === 0 ? 5 : 3.1}
                  fill={`url(#${pearlId})`}
                  style={{ transitionDelay: `${(0.5 + i * 0.03).toFixed(2)}s` }}
                />
              );
            })}
          </svg>
        </div>
        <div ref={fx} className="tpz-fx" aria-hidden="true" />
        <p className="tpz-k">{s.ar ? 'بكل الحب والامتنان' : 'With love & gratitude'}</p>
        <p className="tpz-h">{text(src, 'heading')}</p>
        <p className="tpz-p">{text(src, 'body')}</p>
        <div className="tpz-r" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <p className="tpz-n">
          {names[0]}
          {names[1] ? (
            <>
              {' '}
              <b>&amp;</b> {names[1]}
            </>
          ) : null}
        </p>
        {when ? (
          <p className="tpz-d" dir="ltr">
            {when.dots}
          </p>
        ) : null}
      </div>
    </div>
  );
}
