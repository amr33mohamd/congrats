'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { applyTokens, slotValue, type SceneRenderPropsLike } from './invitation-types';
import { cssFamily } from '@/lib/fonts';
import { readableOn, inkFor } from './color';
import { track } from '@/lib/track';
import { isTheatre, Chandelier, CalendarMark, ClockMark } from './TheatreArt';
import type { EventName } from '@/lib/track-events';

/** Guest actions count only on a shared card page, not in builder/admin previews. */
function trackOnCard(name: EventName) {
  if (/^\/(ar|en)\/p\//.test(window.location.pathname)) track(name);
}

/**
 * The invitation sections of a one-page card: families, events, venue, RSVP,
 * gift. Unlike the expressive scenes (Cover, Quote…) these are INFORMATION —
 * the reader comes back to them for a time or an address — so they favour
 * legibility: small-caps labels, generous rules, one fact per line.
 *
 * All colour comes from the template (accent + text colour), never from app
 * tokens, and every label is chosen by direction so an Arabic card never
 * shows English chrome.
 */

/* ─────────────────────────────── helpers ──────────────────────────────── */

function t(p: SceneRenderPropsLike, key: string): string {
  const f = p.fields ?? {};
  return applyTokens(slotValue(p.scene, p.step, key, f), p.recipientName, f).trim();
}

function colors(p: SceneRenderPropsLike) {
  const s: Partial<NonNullable<SceneRenderPropsLike['scene']['style']>> = p.scene.style ?? {};
  const base = p.theme.textColor ?? '#FFFFFF';
  const accent = s.headingColor ?? p.theme.accent ?? base;
  return {
    accent,
    text: s.bodyColor ?? base,
    heading: cssFamily(s.headingFont ?? p.theme.fontHeading),
    // Label on an accent-filled button. `palette[0]` (the ground) was used
    // before, which on the light paper styles put cream text on a light gold.
    onAccent: /^#[0-9a-f]{3,8}$/i.test(accent) ? readableOn(accent, p.theme.palette ?? []) : '#000',
  };
}

const isAr = (p: SceneRenderPropsLike) => p.direction === 'rtl';

/** A field's colour, darker when the sender switched that field to darker. */
const ink = (p: SceneRenderPropsLike, key: string, color: string) => inkFor(p.step, key, color);

/** Multi-line values ("Mr. X\nMrs. Y") keep their line breaks. */
function Lines({ value, className, style }: { value: string; className?: string; style?: React.CSSProperties }) {
  return (
    <>
      {value.split('\n').map((line, i) => (
        <span key={i} className={`block ${className ?? ''}`} style={style}>
          {line}
        </span>
      ))}
    </>
  );
}

/* ────────────────────────────── ornaments ─────────────────────────────── */

/**
 * The flourish under every section heading. Uses the style's painted divider
 * when one is supplied (theme.art.divider) and an original vector scroll
 * otherwise, so a style reads as finished before its artwork exists.
 */
export function Flourish({ color, art, width = 220 }: { color: string; art?: string; width?: number }) {
  if (art) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={art} alt="" aria-hidden className="mx-auto block h-auto" style={{ width }} />;
  }
  return (
    <svg aria-hidden viewBox="0 0 240 28" width={width} className="mx-auto block" fill="none" stroke={color}>
      <path d="M8 14 H86" strokeWidth="1" />
      <path d="M154 14 H232" strokeWidth="1" />
      <circle cx="4" cy="14" r="2" fill={color} stroke="none" />
      <circle cx="236" cy="14" r="2" fill={color} stroke="none" />
      <path d="M86 14 C 96 4, 106 4, 110 12 C 106 20, 96 22, 92 16" strokeWidth="1.3" />
      <path d="M154 14 C 144 4, 134 4, 130 12 C 134 20, 144 22, 148 16" strokeWidth="1.3" />
      <path d="M120 4 L126 14 L120 24 L114 14 Z" fill={color} stroke="none" />
      <circle cx="104" cy="14" r="1.6" fill={color} stroke="none" />
      <circle cx="136" cy="14" r="1.6" fill={color} stroke="none" />
    </svg>
  );
}

/** Small ornamental bracket flanking a date numeral. */
function Bracket({ color, flip }: { color: string; flip?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 18 64" width="16" height="58" fill="none" stroke={color}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      <path d="M14 2 C 4 10, 4 22, 10 30 C 4 38, 4 52, 14 62" strokeWidth="1.3" />
      <circle cx="10" cy="32" r="2" fill={color} stroke="none" />
      <path d="M14 14 C 10 18, 10 22, 13 26 M14 50 C 10 46, 10 42, 13 38" strokeWidth="0.9" />
    </svg>
  );
}

function SectionHeading({ p, text, slot }: { p: SceneRenderPropsLike; text: string; slot: string }) {
  const c = colors(p);
  if (!text) return null;
  return (
    <div className="mb-token-6 text-center">
      <h2
        className={`font-semibold ${isAr(p) ? 'text-2xl' : 'text-xl uppercase tracking-[0.18em]'}`}
        style={{ color: ink(p, slot, c.accent), fontFamily: c.heading }}
      >
        {text}
      </h2>
      <div className="mt-token-3">
        <Flourish color={c.accent} art={p.theme.art?.divider} />
      </div>
    </div>
  );
}

function Reveal({ p, children, delay = 0 }: { p: SceneRenderPropsLike; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={p.reducedMotion ? false : { opacity: 0, y: 18 }}
      animate={p.active ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="relative z-[1] mx-auto w-full max-w-md px-token-6 py-token-8 text-center">{children}</div>;
}

/* ─────────────────────────────── sections ─────────────────────────────── */

/** Families — each side's names in a column, a hairline rule between. */
export function FamiliesScene(p: SceneRenderPropsLike) {
  const c = colors(p);
  const left = { label: t(p, 'groomLabel'), names: t(p, 'groomFamily'), labelKey: 'groomLabel', namesKey: 'groomFamily' };
  const right = { label: t(p, 'brideLabel'), names: t(p, 'brideFamily'), labelKey: 'brideLabel', namesKey: 'brideFamily' };
  return (
    <Shell>
      <Reveal p={p}>
        {/*
          The invitation templates store this title under `familiesHeading`
          (every saved card has it there); `heading` is the generic key. Read
          both, or the title silently never renders.
        */}
        <SectionHeading
          p={p}
          text={t(p, 'familiesHeading') || t(p, 'heading')}
          slot={t(p, 'familiesHeading') ? 'familiesHeading' : 'heading'}
        />
      </Reveal>
      <Reveal p={p} delay={0.15}>
        <div className="grid grid-cols-[1fr_1px_1fr] items-start gap-token-4">
          {[left, null, right].map((side, i) =>
            side === null ? (
              <span key="rule" aria-hidden className="h-full min-h-20 w-px" style={{ background: c.accent, opacity: 0.45 }} />
            ) : (
              <div key={i}>
                {side.label ? (
                  <p className="mb-token-2 text-sm" style={{ color: ink(p, side.labelKey, c.text), opacity: 0.75 }}>
                    {side.label}
                  </p>
                ) : null}
                <Lines value={side.names} className="text-lg font-semibold leading-relaxed" style={{ color: ink(p, side.namesKey, c.accent), fontFamily: c.heading }} />
              </div>
            ),
          )}
        </div>
      </Reveal>
    </Shell>
  );
}

/** Event — label, venue, time line, and the date set as a large numeral. */
export function EventScene(p: SceneRenderPropsLike) {
  const c = colors(p);
  // Falls back to the card's wedding date unless this event overrides it.
  const raw = slotValue(p.scene, p.step, 'date', p.fields ?? {});
  const d = raw ? new Date(raw) : null;
  const valid = d && !Number.isNaN(d.getTime());
  const locale = isAr(p) ? 'ar-EG' : 'en-GB';
  // A bare `2027-06-18` parses as UTC midnight; read it back in UTC too, or a
  // guest west of Greenwich sees the day before.
  const utc = /^\d{4}-\d{2}-\d{2}$/.test(raw.trim());
  const day = valid ? new Intl.NumberFormat(locale).format(utc ? d!.getUTCDate() : d!.getDate()) : '';
  const month = valid
    ? new Intl.DateTimeFormat(locale, { month: 'long', ...(utc ? { timeZone: 'UTC' } : {}) }).format(d!)
    : '';
  const year = valid
    ? new Intl.NumberFormat(locale, { useGrouping: false }).format(utc ? d!.getUTCFullYear() : d!.getFullYear())
    : '';

  return (
    <Shell>
      {isTheatre(p.theme) && p.scene.id === 'ceremony' ? (
        <Reveal p={p}>
          <Chandelier color={c.accent} />
        </Reveal>
      ) : null}
      <Reveal p={p}>
        <SectionHeading p={p} text={t(p, 'label')} slot="label" />
      </Reveal>
      <Reveal p={p} delay={0.12}>
        {t(p, 'venue') ? (
          <p className="text-lg font-semibold" style={{ color: ink(p, 'venue', c.text), fontFamily: c.heading }}>
            {t(p, 'venue')}
          </p>
        ) : null}
        {t(p, 'when') ? (
          <p className={`mt-token-1 text-sm ${isAr(p) ? '' : 'tracking-wide'}`} style={{ color: ink(p, 'when', c.text), opacity: 0.8 }}>
            {isTheatre(p.theme) ? <ClockMark color={c.accent} /> : null} {t(p, 'when')}
          </p>
        ) : null}
      </Reveal>
      {valid ? (
        <Reveal p={p} delay={0.24}>
          {isTheatre(p.theme) ? (
            <div className="mt-token-5 flex justify-center">
              <CalendarMark color={c.accent} />
            </div>
          ) : null}
          <div className="mt-token-6 flex items-center justify-center gap-token-3" dir="ltr">
            <Bracket color={c.accent} />
            <span className="font-heading text-6xl leading-none tabular-nums" style={{ color: c.accent, fontFamily: c.heading }}>
              {day}
            </span>
            <span aria-hidden className="h-12 w-px" style={{ background: c.accent, opacity: 0.6 }} />
            <span className="text-start leading-tight" style={{ color: c.text }} dir={p.direction}>
              <span className="block text-base font-semibold">{month}</span>
              <span className="block text-sm opacity-80">{year}</span>
            </span>
            <Bracket color={c.accent} flip />
          </div>
        </Reveal>
      ) : null}
    </Shell>
  );
}

const pill =
  'mt-token-6 inline-flex items-center gap-token-2 rounded-pill px-token-6 py-token-3 text-sm font-semibold transition-transform duration-[var(--motion-base)] hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

/** Google hosts: google.com, google.<cc>, google.com.<cc>, google.co.<cc> (optionally www./maps.). */
const GOOGLE_HOST_RE = /^(?:www\.|maps\.)?google\.(?:com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/;

/**
 * True only for an https URL whose HOST is exactly a Google Maps host — parsed
 * with URL, never prefix-matched, so `maps.app.goo.gl.evil.com` is rejected.
 */
export function safeMapsUrl(given: string): boolean {
  if (!given) return false;
  let u: URL;
  try {
    u = new URL(given.trim());
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return false;
  const host = u.hostname.toLowerCase();
  if (host === 'maps.app.goo.gl') return true;
  if (host === 'goo.gl') return u.pathname.startsWith('/maps');
  if (host === 'maps.google.com') return true;
  if (GOOGLE_HOST_RE.test(host)) return u.pathname.startsWith('/maps');
  return false;
}

/** Venue — the address, plus a directions link that opens the phone's maps. */
export function VenueScene(p: SceneRenderPropsLike) {
  const c = colors(p);
  const address = t(p, 'address');
  const given = t(p, 'mapUrl');
  // Only ever link to a real maps URL; otherwise search the address.
  const href = safeMapsUrl(given)
    ? given
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : '';
  return (
    <Shell>
      <Reveal p={p}>
        <SectionHeading p={p} text={t(p, 'heading')} slot="heading" />
      </Reveal>
      <Reveal p={p} delay={0.12}>
        <Lines value={address} className="text-base leading-relaxed" style={{ color: ink(p, 'address', c.text) }} />
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              trackOnCard('directions_click');
            }}
            className={pill}
            style={{ background: c.accent, color: c.onAccent, outlineColor: c.accent }}
          >
            <span aria-hidden>📍</span>
            {isAr(p) ? 'الموقع على الخريطة' : 'Get directions'}
          </a>
        ) : null}
      </Reveal>
    </Shell>
  );
}

/**
 * RSVP — a short form (name, coming or not, how many) saved for the couple,
 * who read the replies in their dashboard. A WhatsApp number, when set, stays
 * as a second way to answer. Only a shared card page submits; builder and
 * admin previews show the form without sending.
 */
export function RsvpScene(p: SceneRenderPropsLike) {
  const c = colors(p);
  const ar = isAr(p);
  const phone = t(p, 'phone').replace(/[^\d]/g, '');
  const guest = p.recipientName || (ar ? 'ضيفكم' : 'your guest');
  const msg = ar
    ? `أهلاً! أنا ${guest}، يسعدني أؤكد حضوري 🤍`
    : `Hi! It's ${guest} — delighted to confirm I'll be there 🤍`;
  const href = phone.length >= 8 ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : '';
  return (
    <Shell>
      <Reveal p={p}>
        <SectionHeading p={p} text={t(p, 'heading')} slot="heading" />
      </Reveal>
      <Reveal p={p} delay={0.12}>
        <Lines value={t(p, 'body')} className="text-base leading-relaxed" style={{ color: ink(p, 'body', c.text) }} />
        <RsvpForm p={p} />
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              trackOnCard('rsvp_click');
            }}
            className="mt-token-4 inline-block text-sm font-semibold underline underline-offset-4"
            style={{ color: c.accent }}
          >
            {ar ? 'أو أكّد على واتساب' : 'Or reply on WhatsApp'}
          </a>
        ) : null}
      </Reveal>
    </Shell>
  );
}

/** The slug of the shared card page this runs on, or null in a preview. */
function cardSlug(): string | null {
  if (typeof window === 'undefined') return null;
  return /^\/(?:ar|en)\/p\/([^/?#]+)/.exec(window.location.pathname)?.[1] ?? null;
}

const rsvpSentKey = (slug: string) => `rsvp:${slug}`;

function RsvpForm({ p }: { p: SceneRenderPropsLike }) {
  const c = colors(p);
  const ar = isAr(p);
  const [name, setName] = React.useState('');
  const [attending, setAttending] = React.useState<boolean | null>(null);
  const [guests, setGuests] = React.useState(1);
  const [state, setState] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [sentAttending, setSentAttending] = React.useState(true);

  // Someone who already answered on this phone sees their answer, not the form.
  React.useEffect(() => {
    const slug = cardSlug();
    if (!slug) return;
    try {
      const saved = window.localStorage.getItem(rsvpSentKey(slug));
      if (saved) {
        setSentAttending(saved === 'yes');
        setState('sent');
      }
    } catch {
      /* storage blocked — show the form */
    }
  }, []);

  const valid = name.trim().length >= 2 && attending !== null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!valid || state === 'sending') return;
    const slug = cardSlug();
    if (!slug) {
      // Builder / admin preview: show the result without saving anything.
      setSentAttending(attending);
      setState('sent');
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, name: name.trim(), attending, guests: attending ? guests : 0 }),
      });
      if (!res.ok) throw new Error(String(res.status));
      try {
        window.localStorage.setItem(rsvpSentKey(slug), attending ? 'yes' : 'no');
      } catch {
        /* storage blocked — the reply is saved anyway */
      }
      trackOnCard('rsvp_click');
      setSentAttending(attending);
      setState('sent');
    } catch {
      setState('error');
    }
  };

  const faint = `color-mix(in srgb, ${c.text} 35%, transparent)`;
  const line = { borderColor: faint, color: c.text } as React.CSSProperties;
  const choice = (on: boolean) =>
    on
      ? { background: c.accent, borderColor: c.accent, color: c.onAccent }
      : { borderColor: faint, color: c.text };

  if (state === 'sent') {
    return (
      <p className="mt-token-6 text-lg font-semibold" style={{ color: c.accent }} role="status">
        {sentAttending
          ? ar
            ? 'وصل ردك، في انتظارك 🤍'
            : 'Got it — see you there 🤍'
          : ar
            ? 'وصل ردك، هنفتقدك 🤍'
            : "Got it — you'll be missed 🤍"}
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="mx-auto mt-token-6 flex w-full max-w-xs flex-col gap-token-3 text-start"
      dir={ar ? 'rtl' : 'ltr'}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        autoComplete="name"
        placeholder={ar ? 'اسمك' : 'Your name'}
        aria-label={ar ? 'اسمك' : 'Your name'}
        className="w-full rounded-md border bg-transparent px-token-4 py-token-3 text-base outline-none placeholder:opacity-60 focus:border-current"
        style={line}
      />
      <div className="grid grid-cols-2 gap-token-2" role="radiogroup" aria-label={ar ? 'هتحضر؟' : 'Coming?'}>
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={attending === v}
            onClick={() => setAttending(v)}
            className="rounded-md border px-token-2 py-token-3 text-sm font-semibold transition-colors"
            style={choice(attending === v)}
          >
            {v ? (ar ? 'جاي إن شاء الله' : "I'll be there") : ar ? 'مش هقدر آجي' : "Can't make it"}
          </button>
        ))}
      </div>
      {attending ? (
        <div className="flex items-center justify-between rounded-md border px-token-4 py-token-2" style={line}>
          <span className="text-sm">{ar ? 'عدد الأفراد' : 'How many'}</span>
          <div className="flex items-center gap-token-3" dir="ltr">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              aria-label={ar ? 'أقل' : 'Fewer'}
              className="h-8 w-8 rounded-full border text-lg leading-none"
              style={line}
            >
              −
            </button>
            <span className="w-6 text-center text-lg font-semibold" aria-live="polite">
              {guests}
            </span>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(20, g + 1))}
              aria-label={ar ? 'أكتر' : 'More'}
              className="h-8 w-8 rounded-full border text-lg leading-none"
              style={line}
            >
              +
            </button>
          </div>
        </div>
      ) : null}
      <button
        type="submit"
        disabled={!valid || state === 'sending'}
        className={`${pill.replace('mt-token-6 ', '')} mt-token-2 justify-center disabled:opacity-50`}
        style={{ background: c.accent, color: c.onAccent, outlineColor: c.accent }}
      >
        {state === 'sending' ? (ar ? 'بيتبعت…' : 'Sending…') : ar ? 'ابعت الرد' : 'Send reply'}
      </button>
      {state === 'error' ? (
        <p className="text-center text-sm" style={{ color: c.text }} role="alert">
          {ar ? 'محصلش إرسال، جرّب تاني.' : "Couldn't send — try again."}
        </p>
      ) : null}
    </form>
  );
}

/** Gift — a note plus transfer details the guest can copy in one tap. */
export function GiftScene(p: SceneRenderPropsLike) {
  const c = colors(p);
  const account = t(p, 'account');
  const [copied, setCopied] = React.useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the value is still visible to copy by hand */
    }
  };
  return (
    <Shell>
      <Reveal p={p}>
        <SectionHeading p={p} text={t(p, 'heading')} slot="heading" />
      </Reveal>
      <Reveal p={p} delay={0.12}>
        <Lines value={t(p, 'body')} className="text-base leading-relaxed" style={{ color: ink(p, 'body', c.text) }} />
        {account ? (
          <div
            className="mx-auto mt-token-6 flex max-w-xs items-center justify-between gap-token-3 rounded-xl px-token-4 py-token-3"
            style={{ boxShadow: `inset 0 0 0 1px ${c.accent}66` }}
          >
            <span className="font-mono text-sm tabular-nums" style={{ color: ink(p, 'account', c.text) }} dir="ltr">
              {account}
            </span>
            <button
              type="button"
              onClick={copy}
              className="rounded-pill px-token-3 py-token-1 text-xs font-semibold"
              style={{ background: c.accent, color: c.onAccent }}
            >
              {copied ? (isAr(p) ? 'تم النسخ' : 'Copied') : isAr(p) ? 'نسخ' : 'Copy'}
            </button>
          </div>
        ) : null}
      </Reveal>
    </Shell>
  );
}
