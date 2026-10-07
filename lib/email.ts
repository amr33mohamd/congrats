/**
 * Pluggable transactional email. If RESEND_API_KEY is set, sends via the Resend
 * HTTP API; otherwise logs the message (so flows like password reset are fully
 * testable in dev without an email provider). Swap in any provider here without
 * touching callers.
 */
import { isSyntheticEmail } from './synthetic-email';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const FROM = process.env.EMAIL_FROM ?? 'Congrats <no-reply@congrats.dev>';

export async function sendEmail(msg: EmailMessage): Promise<{ delivered: boolean }> {
  // Facebook accounts without an email have a placeholder address; there is
  // no inbox behind it.
  if (isSyntheticEmail(msg.to)) return { delivered: false };
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev fallback — surface the content in the server log so it can be used.
    console.info(
      `\n📧 [email:dev] no RESEND_API_KEY set — logging instead of sending.\n` +
        `   to:      ${msg.to}\n` +
        `   subject: ${msg.subject}\n` +
        `   text:    ${msg.text ?? msg.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n`,
    );
    return { delivered: false };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text }),
    });
    if (!res.ok) {
      console.error('[email] provider error', res.status, await res.text().catch(() => ''));
      return { delivered: false };
    }
    return { delivered: true };
  } catch (err) {
    console.error('[email] send failed', err);
    return { delivered: false };
  }
}

/** Absolute base URL for building links in emails. */
export function appBaseUrl(): string {
  return (process.env.AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
