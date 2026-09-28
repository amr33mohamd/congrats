/**
 * Tiny in-process fixed-window rate limiter. Good enough for a single-node
 * deployment (the default Docker stack); swap the Map for Redis/Upstash when
 * running multiple instances. Keyed by an arbitrary string (e.g. ip:route).
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  // The e2e suite registers/logs in dozens of accounts from one IP within a
  // minute. It may switch limiting off — never in production.
  if (process.env.RATE_LIMIT_DISABLED === '1' && process.env.NODE_ENV !== 'production') {
    return { ok: true, remaining: limit, retryAfterSec: 0 };
  }
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: limit - existing.count, retryAfterSec: 0 };
}

/**
 * Client IP for rate-limit keys. Never trusts the LEFT-most X-Forwarded-For
 * entry: clients can send any XFF they like and proxies only append to it.
 *
 *  - On Fly.io (FLY_APP_NAME set) the edge sets `Fly-Client-IP` itself.
 *  - Otherwise we take the entry TRUSTED_PROXY_HOPS positions from the right
 *    (default 1 = the address seen by the single reverse proxy in front of
 *    the app, e.g. Render's). Set TRUSTED_PROXY_HOPS=0 when the app is exposed
 *    directly with no proxy: XFF is then ignored entirely.
 *  - Falls back to `x-real-ip` (only when hops > 0) and then 'local'.
 */
export function clientIp(req: Request): string {
  if (process.env.FLY_APP_NAME) {
    const fly = req.headers.get('fly-client-ip')?.trim();
    if (fly) return fly;
  }
  const rawHops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? '1', 10);
  const hops = Number.isFinite(rawHops) && rawHops >= 0 ? rawHops : 1;
  if (hops === 0) return 'local';
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const parts = fwd
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[Math.max(0, parts.length - hops)]!;
  }
  return req.headers.get('x-real-ip')?.trim() || 'local';
}

// Periodically drop expired buckets so the Map can't grow without bound.
// (Node only — guarded so it is a no-op in edge runtimes.)
if (typeof setInterval === 'function') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }, 60_000);
  // Don't keep the event loop alive just for cleanup.
  (timer as { unref?: () => void }).unref?.();
}
