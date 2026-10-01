import { describe, expect, it } from 'vitest';
import { remainingUntil } from './countdown';

// 1 Oct 2026, 04:04 in Cairo (summer time, UTC+3) = 01:04 UTC.
const now = new Date('2026-10-01T01:04:00Z');

describe('remainingUntil', () => {
  it('counts calendar time in the wedding zone, ignoring the daylight-saving jump', () => {
    // 15 Dec 2027 19:00 Cairo is winter time; the absolute gap is an hour longer.
    expect(remainingUntil('2027-12-15T19:00', now)).toEqual({ d: 440, h: 14, m: 56, s: 0 });
  });

  it('treats a date-only value as midnight that day', () => {
    expect(remainingUntil('2026-10-02', now)).toEqual({ d: 0, h: 19, m: 56, s: 0 });
  });

  it('measures a value with its own offset as a real instant', () => {
    expect(remainingUntil('2026-10-01T02:04:30Z', now)).toEqual({ d: 0, h: 1, m: 0, s: 30 });
  });

  it('is null once the moment has passed, or for nonsense', () => {
    expect(remainingUntil('2026-09-30T10:00', now)).toBeNull();
    expect(remainingUntil('soon', now)).toBeNull();
    expect(remainingUntil('', now)).toBeNull();
  });
});
