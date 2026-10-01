'use client';

/**
 * Browser-side event tracking. One call — `track('publish', {...})` — goes to:
 *  1. our own log (POST /api/t → events table → Admin → Analytics),
 *  2. the Meta Pixel when NEXT_PUBLIC_META_PIXEL_ID is set (ad optimisation),
 *  3. Plausible when it is loaded.
 *
 * The visitor id is random and lives in localStorage; nothing personal is
 * sent. The latest ad touch (utm_* on the landing URL) is remembered for 30
 * days so a signup or payment days later is credited to the ad that brought
 * the visitor in.
 */
import { PIXEL_EVENTS, type EventName, type EventProps } from './track-events';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    plausible?: (event: string, opts?: { props?: EventProps }) => void;
    /** Set once the first PageView reached the pixel (by track() or the loader). */
    __cgPixelPv?: number;
  }
}

const VID_KEY = 'cg_vid';
const UTM_KEY = 'cg_utm';
const UTM_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type Utm = { source?: string; medium?: string; campaign?: string; content?: string; at?: number };

function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function visitorId(): string {
  const s = store();
  let id = s?.getItem(VID_KEY);
  if (!id) {
    id = randomId();
    s?.setItem(VID_KEY, id);
  }
  return id;
}

/** Read utm_* (or a bare fbclid) from the URL; fall back to the remembered touch. */
export function attribution(search: string = window.location.search): Utm | undefined {
  const s = store();
  const q = new URLSearchParams(search);
  const fresh: Utm = {
    source: q.get('utm_source') || (q.get('fbclid') ? 'facebook' : undefined),
    medium: q.get('utm_medium') || (q.get('fbclid') ? 'paid' : undefined),
    campaign: q.get('utm_campaign') || undefined,
    content: q.get('utm_content') || undefined,
  };
  if (fresh.source || fresh.campaign) {
    s?.setItem(UTM_KEY, JSON.stringify({ ...fresh, at: Date.now() }));
    return fresh;
  }
  try {
    const saved = JSON.parse(s?.getItem(UTM_KEY) ?? 'null') as Utm | null;
    if (saved && saved.at && Date.now() - saved.at < UTM_TTL_MS) {
      const { at: _at, ...utm } = saved;
      return utm;
    }
  } catch {
    /* corrupt entry — treat as direct */
  }
  return undefined;
}

function externalReferrer(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).hostname;
    return host && host !== window.location.hostname ? host : undefined;
  } catch {
    return undefined;
  }
}

export function track(name: EventName, props?: EventProps): void {
  if (typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({
      n: name,
      v: visitorId(),
      p: window.location.pathname,
      r: externalReferrer(),
      props,
      utm: attribution(),
    });
    const sent = navigator.sendBeacon?.('/api/t', new Blob([body], { type: 'application/json' }));
    if (!sent) {
      void fetch('/api/t', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    }
  } catch {
    /* tracking must never break the page */
  }

  try {
    if (window.fbq) {
      const std = PIXEL_EVENTS[name];
      const data: Record<string, unknown> = { ...props };
      if (typeof props?.value === 'number') data.currency = 'EGP';
      if (std === 'PageView') {
        window.__cgPixelPv = 1;
        window.fbq('track', 'PageView');
      }
      else if (std) window.fbq('track', std, data);
      else window.fbq('trackCustom', name, data);
    }
    window.plausible?.(name === 'page_view' ? 'pageview' : name, props ? { props } : undefined);
  } catch {
    /* ignore third-party failures */
  }
}
