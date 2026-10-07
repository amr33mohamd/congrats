/**
 * Where to go after signing in: a local path only (never another site), so
 * `/login?next=https://evil.example` can't be used as an open redirect.
 */
export function safeNextPath(raw: string | string[] | null | undefined, fallback = '/dashboard'): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== 'string' || !v) return fallback;
  if (!v.startsWith('/') || v.startsWith('//') || v.includes('\\')) return fallback;
  // Control characters (tabs/newlines are stripped by URL parsers) could
  // smuggle a protocol-relative URL past the checks above.
  if (/[\u0000-\u001f\u007f]/.test(v)) return fallback;
  return v;
}
