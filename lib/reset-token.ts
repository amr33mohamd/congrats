/**
 * Password-reset token helpers. The raw token is sent in the email link; only
 * its SHA-256 hash is stored, so a database leak can't be used to reset accounts.
 */
import { randomBytes, createHash } from 'node:crypto';

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  return { raw, hash: hashResetToken(raw) };
}

export function hashResetToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
