/**
 * Time left until a card's date, the way people count it.
 *
 * Card dates are wall-clock values typed in the builder ("2027-12-15T19:00",
 * or "2027-12-15") with no time zone. Measuring them as absolute instants in
 * the viewer's zone was wrong twice over:
 *  - across a daylight-saving change (Egypt: UTC+3 in summer, UTC+2 in
 *    winter) the count was an hour off — "7 pm" in December read as 15 h
 *    away at 4 am in October instead of 14 h 56 m;
 *  - a guest abroad counted to 7 pm in THEIR zone, not the wedding's.
 * So both "now" and the target are read as wall-clock time in the event's
 * zone and subtracted as calendar time. A value that carries its own offset
 * ("…Z", "+02:00") is a real instant and is measured as such.
 */
export const DEFAULT_EVENT_TIME_ZONE = 'Africa/Cairo';

export interface Remaining {
  d: number;
  h: number;
  m: number;
  s: number;
}

const HAS_OFFSET = /(Z|[+-]\d\d:?\d\d)$/i;
const WALL = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

/** `now` as wall-clock milliseconds (fields read in `timeZone`, packed as if UTC). */
function wallClockMs(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
}

/** Milliseconds until `target`, or NaN when it is not a date. */
export function msUntil(target: string, now: Date = new Date(), timeZone = DEFAULT_EVENT_TIME_ZONE): number {
  const value = target.trim();
  if (HAS_OFFSET.test(value)) return new Date(value).getTime() - now.getTime();
  const m = WALL.exec(value);
  if (!m) return Number.NaN;
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = m;
  const targetWall = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
  return targetWall - wallClockMs(now, timeZone);
}

/** Days / hours / minutes / seconds left, or null when invalid or past. */
export function remainingUntil(target: string, now: Date = new Date(), timeZone = DEFAULT_EVENT_TIME_ZONE): Remaining | null {
  const diff = msUntil(target, now, timeZone);
  if (!Number.isFinite(diff) || diff <= 0) return null;
  const total = Math.floor(diff / 1000);
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}
