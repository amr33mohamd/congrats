/**
 * Emails the owner when something needs their attention: a new sign-up, or a
 * payment waiting for manual approval. Goes to ADMIN_NOTIFY_EMAIL (falls back
 * to SEED_ADMIN_EMAIL). Callers run it through next/server `after()`, so a
 * slow or failing email never delays or breaks the user's request.
 */
import { sendEmail, appBaseUrl } from './email';
import { isSyntheticEmail } from './synthetic-email';

export function adminNotifyEmail(env: Record<string, string | undefined> = process.env): string | null {
  const to = (env.ADMIN_NOTIFY_EMAIL || env.SEED_ADMIN_EMAIL || '').trim();
  return to || null;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface AdminNotice {
  subject: string;
  /** Label → value rows; values are user-supplied, so they are escaped. */
  rows: [string, string][];
  /** Path on the site (e.g. /ar/admin/queue) for the action button. */
  actionPath?: string;
  actionLabel?: string;
}

export function renderAdminNotice(n: AdminNotice, base = appBaseUrl()): { html: string; text: string } {
  // A Facebook-only account's placeholder address means nothing to the owner.
  const shown = n.rows.map(([k, v]) => [k, isSyntheticEmail(v) ? 'Facebook account (no email)' : v] as const);
  const rows = shown
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${escapeHtml(k)}</td><td style="padding:4px 0"><b>${escapeHtml(v)}</b></td></tr>`)
    .join('');
  const button = n.actionPath
    ? `<p style="margin-top:20px"><a href="${base}${n.actionPath}" style="background:#F0436E;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">${escapeHtml(n.actionLabel ?? 'Open')}</a></p>`
    : '';
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px"><h2 style="margin:0 0 12px">${escapeHtml(n.subject)}</h2><table>${rows}</table>${button}</div>`;
  const text = [n.subject, ...shown.map(([k, v]) => `${k}: ${v}`), n.actionPath ? `${base}${n.actionPath}` : '']
    .filter(Boolean)
    .join('\n');
  return { html, text };
}

export async function notifyAdmin(n: AdminNotice): Promise<void> {
  const to = adminNotifyEmail();
  if (!to) return;
  try {
    const { html, text } = renderAdminNotice(n);
    await sendEmail({ to, subject: `[Congrats] ${n.subject}`, html, text });
  } catch (err) {
    console.error('[admin-notify] failed', err);
  }
}

export const cairoTime = (d = new Date()) =>
  d.toLocaleString('en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' });
