'use client';

/**
 * The White Bloom stage's shared pieces: palette, date helpers, the pearl
 * ornaments, the cover and the stage CSS. Split from the player so the
 * gallery thumbnail (components/templates/TemplateStage) can draw the real
 * cover without pulling in the whole player.
 */
import * as React from 'react';
import { motion } from 'framer-motion';
import { applyTokens, slotValue, type BoundExperience, type BoundStep, type SceneDef } from '@/lib/template-contract';
import { cssFamily } from '@/lib/fonts';

/* ───────────────────────────────── palette ──────────────────────────────── */

export const C = {
  teal: '#0B3F48',
  tealSoft: '#2C5B62',
  tealKey: '#2F7F88',
  pearl: '#F6FBFB',
  gold: '#B8975A',
  goldLight: '#E2C98F',
  goldPale: '#F2E3BD',
  paper: '#F4F5F2',
};

export const SMALL_CAPS = "'Marcellus', 'Cormorant Garamond', serif";

/* ───────────────────────────────── helpers ──────────────────────────────── */

export interface Ctx {
  scene: SceneDef;
  step: BoundStep;
  experience: BoundExperience;
  ar: boolean;
  /** Light ink: this is a turquoise panel. */
  dark: boolean;
  ink: string;
  soft: string;
  key: string;
  nameFont: string;
  revealed: boolean;
  reduced: boolean;
  embedded: boolean;
  /** The venue's address, for the calendar entry. */
  address: string;
}

export function text(c: Pick<Ctx, 'scene' | 'step' | 'experience'>, key: string): string {
  const f = c.experience.fields ?? {};
  return applyTokens(slotValue(c.scene, c.step, key, f), c.experience.recipientName, f).trim();
}

export const WALL = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

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
 * into the pieces the panels show. Built from UTC parts and formatted in UTC
 * so the day never slips for a guest abroad.
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
    new Intl.NumberFormat(loc, {
      minimumIntegerDigits: digits,
      useGrouping: false,
    }).format(n);
  const time = h
    ? new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-US', {
        timeZone: 'UTC',
        hour: 'numeric',
        minute: '2-digit',
      }).format(at)
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

/* ───────────────────────────── small ornaments ──────────────────────────── */

export function Pearl({ size = 7 }: { size?: number }) {
  return <i aria-hidden className="bl-pearl" style={{ width: size, height: size }} />;
}

/** A gold hairline either side of a pearl (or three pearls). */
export function PearlRule({ color, triple = false, width = 42 }: { color: string; triple?: boolean; width?: number }) {
  const line = (dir: 'l' | 'r') => (
    <b
      aria-hidden
      className="block h-px"
      style={{
        width,
        background: `linear-gradient(${dir === 'l' ? 90 : 270}deg, transparent, ${color})`,
      }}
    />
  );
  return (
    <div className="my-[16px] flex items-center justify-center gap-[7px]" aria-hidden>
      {line('l')}
      {triple ? (
        <>
          <Pearl size={6} />
          <Pearl size={9} />
          <Pearl size={6} />
        </>
      ) : (
        <Pearl size={8} />
      )}
      {line('r')}
    </div>
  );
}

export function Kicker({ c, children, color }: { c: Ctx; children: React.ReactNode; color?: string }) {
  if (!children) return null;
  return (
    <p
      className={c.ar ? 'text-[15px] leading-relaxed' : 'text-[11.5px] uppercase leading-[1.6] tracking-[0.32em]'}
      style={{
        color: color ?? c.key,
        fontFamily: c.ar ? undefined : SMALL_CAPS,
      }}
    >
      {children}
    </p>
  );
}

export function Script({
  c,
  children,
  size = 50,
  color,
}: {
  c: Ctx;
  children: React.ReactNode;
  size?: number;
  color?: string;
}) {
  if (!children) return null;
  return (
    <p
      className="[overflow-wrap:anywhere]"
      style={{
        fontFamily: c.nameFont,
        fontSize: c.ar ? size * 0.72 : size,
        lineHeight: c.ar ? 1.6 : 1.15,
        color: color ?? c.ink,
      }}
    >
      {children}
    </p>
  );
}

/** Fades its children up the first time the panel is on screen. */
export function Rise({
  c,
  i = 0,
  children,
  className,
}: {
  c: Ctx;
  i?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={c.reduced ? false : { opacity: 0, y: 18 }}
      animate={c.revealed ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, delay: 0.12 * i, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────────────── sections ─────────────────────────────── */

export function CoverPanel({ c, started, onOpen }: { c: Ctx; started: boolean; onOpen: () => void }) {
  const names = splitNames(text(c, 'heading'));
  const when = whenParts(text(c, 'date'), c.ar);
  const recipient = c.experience.recipientName.trim();
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="flex flex-col items-center" style={{ width: '62%' }}>
        <Rise c={c}>
          <Kicker c={c}>{text(c, 'coverKicker')}</Kicker>
        </Rise>
        <Rise c={c} i={1} className="mt-[10px]">
          {names.length === 2 ? (
            <>
              <Script c={c} size={52}>
                {names[0]}
              </Script>
              <p
                className="my-[2px] text-[22px] italic leading-none"
                style={{
                  color: C.gold,
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                &amp;
              </p>
              <Script c={c} size={52}>
                {names[1]}
              </Script>
            </>
          ) : (
            <Script c={c} size={44}>
              {names[0]}
            </Script>
          )}
        </Rise>
        {when ? (
          <Rise c={c} i={2}>
            <PearlRule color={C.gold} triple width={28} />
            <p className="text-[13px] tracking-[0.2em]" style={{ color: c.ink, fontFamily: SMALL_CAPS }} dir="ltr">
              {when.dots}
            </p>
          </Rise>
        ) : null}
      </div>
      <div className="absolute inset-x-0 bottom-[6%] flex flex-col items-center gap-[10px]">
        {recipient ? (
          <p className="text-[15px] italic" style={{ color: c.soft }}>
            {c.ar ? `إلى ${recipient}` : `For ${recipient}`}
          </p>
        ) : null}
        {started ? (
          <span aria-hidden className="bl-hint text-[18px]" style={{ color: C.gold }}>
            ⌄
          </span>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="bl-open inline-flex items-center gap-[10px] rounded-full px-[26px] py-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              background: 'rgba(255,255,255,0.92)',
              color: C.teal,
              boxShadow: `0 0 0 1px ${C.tealKey}66, 0 8px 24px -10px rgba(11,63,72,0.5)`,
              outlineColor: C.tealKey,
              fontFamily: c.ar ? undefined : SMALL_CAPS,
            }}
          >
            <Pearl size={6} />
            <span className={c.ar ? 'text-[15px]' : 'text-[12px] uppercase tracking-[0.3em]'}>
              {c.ar ? 'افتح الدعوة' : 'Tap to open'}
            </span>
            <Pearl size={6} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────── CSS ────────────────────────────────── */

export const SATIN_V =
  'linear-gradient(90deg,#08414b 0%,#157a86 16%,#3fb3bb 38%,#a5e4e6 47%,#3fb3bb 56%,#13707c 80%,#073a43 100%)';
export const SATIN_H =
  'linear-gradient(180deg,#08414b 0%,#157a86 16%,#3fb3bb 38%,#a5e4e6 47%,#3fb3bb 56%,#13707c 80%,#073a43 100%)';

export const BLOOM_CSS = `
[data-stage="bloom"] .bl-pearl{display:inline-block;flex:none;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0 25%,#e9e4dc 60%,#b9b1a5);box-shadow:0 1px 3px rgba(0,0,0,.3)}
[data-stage="bloom"] .bl-shine{color:${C.goldPale};background:linear-gradient(100deg,${C.goldPale} 0%,${C.goldPale} 40%,#fff 50%,${C.goldPale} 60%,${C.goldPale} 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:bl-shine 6s 1s ease-in-out infinite}
@keyframes bl-shine{0%,100%{background-position:100% 0}50%{background-position:0 0}}
[data-stage="bloom"] .bl-hint{animation:bl-bob 2.4s ease-in-out infinite}
[data-stage="bloom"] .bl-open{animation:bl-glow 2.4s ease-in-out infinite}
[data-stage="bloom"] .bl-untie{transition:opacity .5s ease;animation:bl-glow 2.4s ease-in-out infinite}
@keyframes bl-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
@keyframes bl-glow{0%,100%{opacity:1}50%{opacity:.62}}
[data-stage="bloom"] .bl-card::before{content:'';position:absolute;inset:11px;border:1px solid rgba(184,151,90,.55);border-radius:2px;pointer-events:none}
[data-stage="bloom"] .bl-card::after{content:'';position:absolute;inset:15px;border:1px solid rgba(47,127,136,.25);border-radius:1px;pointer-events:none}
[data-stage="bloom"] .bl-line{transition:opacity .9s ease}
[data-stage="bloom"] .bl-ribbon{clip-path:inset(0 round 4px)}
[data-stage="bloom"] .bl-ribbon>i{position:absolute;display:block;transition:transform 1s cubic-bezier(.6,0,.2,1),opacity 1s ease}
[data-stage="bloom"] .bl-ribbon>.v1,[data-stage="bloom"] .bl-ribbon>.v2{left:50%;width:46px;margin-left:-23px;background:${SATIN_V};box-shadow:-1px 0 0 rgba(0,0,0,.12),1px 0 0 rgba(0,0,0,.12)}
[data-stage="bloom"] .bl-ribbon>.v1{top:0;height:50%}
[data-stage="bloom"] .bl-ribbon>.v2{bottom:0;height:50%}
[data-stage="bloom"] .bl-ribbon>.h1,[data-stage="bloom"] .bl-ribbon>.h2{top:50%;height:46px;margin-top:-23px;background:${SATIN_H};box-shadow:0 -1px 0 rgba(0,0,0,.12),0 1px 0 rgba(0,0,0,.12)}
[data-stage="bloom"] .bl-ribbon>.h1{left:0;width:50%}
[data-stage="bloom"] .bl-ribbon>.h2{right:0;width:50%}
[data-stage="bloom"] .bl-ribbon>.t1,[data-stage="bloom"] .bl-ribbon>.t2{top:50%;left:50%;width:30px;height:92px;margin:6px 0 0 -15px;transform-origin:50% 0;background:linear-gradient(90deg,#0a4a55,#2aa3ad 40%,#8fdadd 50%,#2aa3ad 60%,#0a4a55);clip-path:polygon(0 0,100% 0,100% 100%,50% 86%,0 100%)}
[data-stage="bloom"] .bl-ribbon>.t1{transform:rotate(24deg)}
[data-stage="bloom"] .bl-ribbon>.t2{transform:rotate(-24deg)}
[data-stage="bloom"] .bl-bow{position:absolute;left:50%;top:50%;width:78px;height:78px;margin:-39px 0 0 -39px;transition:transform .7s cubic-bezier(.5,-.3,.4,1),opacity .5s .15s ease;filter:drop-shadow(0 4px 6px rgba(7,58,67,.35))}
[data-stage="bloom"] .bl-card.is-open .bl-ribbon>.v1{transform:translateY(-104%);transition-delay:.2s}
[data-stage="bloom"] .bl-card.is-open .bl-ribbon>.v2{transform:translateY(104%);transition-delay:.2s}
[data-stage="bloom"] .bl-card.is-open .bl-ribbon>.h1{transform:translateX(-104%);transition-delay:.3s}
[data-stage="bloom"] .bl-card.is-open .bl-ribbon>.h2{transform:translateX(104%);transition-delay:.3s}
[data-stage="bloom"] .bl-card.is-open .bl-ribbon>.t1{transform:rotate(40deg) translateY(160px);opacity:0;transition-duration:.8s}
[data-stage="bloom"] .bl-card.is-open .bl-ribbon>.t2{transform:rotate(-40deg) translateY(160px);opacity:0;transition-duration:.8s}
[data-stage="bloom"] .bl-card.is-open .bl-bow{transform:translateY(-46px) scale(.5);opacity:0}
[data-stage="bloom"] .bl-gem{width:min(13.5cqw,56px);height:min(13.5cqw,56px)}
[data-stage="bloom"] .bl-gem.is-big{width:min(20.5cqw,86px);height:min(20.5cqw,86px)}
[data-stage="bloom"] .bl-gem>b{position:absolute;inset:0;border:1px solid ${C.goldLight};background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.03) 55%,rgba(255,255,255,.1));box-shadow:inset 0 0 0 4px rgba(11,63,72,.35),inset 0 0 0 5px rgba(226,201,143,.35);transform:rotate(0) scale(.6);opacity:0;transition:transform 1s cubic-bezier(.2,.8,.2,1),opacity .8s ease}
[data-stage="bloom"] .bl-gem>b.is-live{transform:rotate(45deg);opacity:1}
[data-stage="bloom"] .bl-gem-cap{font-family:${SMALL_CAPS};font-size:min(3.3cqw,13.5px);letter-spacing:.12em;text-transform:uppercase;color:${C.pearl}}
[data-stage="bloom"] .bl-gem-num{font-family:'Cormorant Garamond',serif;font-weight:500;line-height:1;color:${C.pearl}}
[data-stage="bloom"] .bl-drop{position:absolute;left:50%;top:100%;width:12px;height:15px;margin:14px 0 0 -6px;border-radius:50% 50% 50% 50%/42% 42% 58% 58%;background:radial-gradient(circle at 35% 30%,#fff 0 22%,#ece7e0 55%,#b9b1a5);box-shadow:0 2px 3px rgba(0,0,0,.35)}
[data-stage="bloom"] .bl-drop::before{content:'';position:absolute;left:50%;bottom:100%;width:1px;height:12px;background:${C.goldLight}}
[data-stage="bloom"] .bl-chain{display:block;width:2px;background:repeating-linear-gradient(180deg,${C.gold} 0 3px,rgba(184,151,90,.25) 3px 5px)}
[data-stage="bloom"] .bl-cap{display:block;width:14px;height:7px;margin-top:-1px;border-radius:7px 7px 2px 2px;background:linear-gradient(180deg,#f1dfae,${C.gold} 60%,#7d6232)}
[data-stage="bloom"] .bl-big-pearl{position:relative;display:flex;align-items:center;justify-content:center;width:min(17cqw,70px);height:min(17cqw,70px);margin-top:-2px;border-radius:50%;background:radial-gradient(circle at 34% 28%,#fff 0 18%,#f4f1ec 42%,#d9d2c7 78%,#b7ad9f 100%);box-shadow:0 8px 16px -6px rgba(11,63,72,.45),inset -4px -6px 10px rgba(120,110,95,.25);transition:opacity .8s ease}
[data-stage="bloom"] .bl-big-pearl::after{content:'';position:absolute;left:22%;top:16%;width:26%;height:14%;border-radius:50%;background:rgba(255,255,255,.9);transform:rotate(-32deg)}
[data-stage="bloom"] .bl-sway{transform-origin:50% 0;animation:bl-sway 4.6s ease-in-out infinite alternate}
@keyframes bl-sway{from{transform:rotate(-2.2deg)}to{transform:rotate(2.2deg)}}
[data-stage="bloom"] .bl-node .bl-pearl{box-shadow:0 0 0 5px rgba(11,63,72,.6),0 0 0 6px rgba(226,201,143,.8)}
[data-stage="bloom"] .bl-form input::placeholder{color:rgba(246,251,251,.6)}
@media (prefers-reduced-motion: reduce){[data-stage="bloom"] *{animation:none!important;transition-duration:.01s!important;transition-delay:0s!important}}
`;

/**
 * The cover as a still, for the gallery thumbnail: the same layout the guest
 * sees before tapping, drawn over the artwork the thumbnail already paints.
 */
export function BloomCoverStill({
  scene,
  step,
  experience,
}: {
  scene: SceneDef;
  step: BoundStep;
  experience: BoundExperience;
}) {
  const style: Partial<NonNullable<SceneDef['style']>> = scene.style ?? {};
  const c: Ctx = {
    scene,
    step,
    experience,
    ar: experience.direction === 'rtl',
    dark: false,
    ink: style.headingColor ?? C.teal,
    soft: C.tealSoft,
    key: C.tealKey,
    nameFont: cssFamily(style.headingFont ?? experience.theme.fontHeading),
    revealed: true,
    reduced: true,
    embedded: true,
    address: '',
  };
  return (
    <div data-stage="bloom" className="absolute inset-0">
      <style>{BLOOM_CSS}</style>
      <CoverPanel c={c} started={false} onOpen={() => {}} />
    </div>
  );
}
