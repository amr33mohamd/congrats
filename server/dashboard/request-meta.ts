/** Extract client IP + user agent from a request for audit-log attribution. */
export function requestMeta(req: Request): { ip?: string; userAgent?: string } {
  const h = req.headers;
  const fwd = h.get('x-forwarded-for');
  const ip = fwd?.split(',')[0]?.trim() || h.get('x-real-ip') || undefined;
  const userAgent = h.get('user-agent') || undefined;
  return { ip: ip ?? undefined, userAgent };
}
