/**
 * Placeholder addresses for OAuth accounts that shared no (verified) email —
 * typically Facebook accounts registered with a phone number. users.email is
 * NOT NULL UNIQUE, so these rows get `fb-<providerAccountId>@users.congrats.local`.
 * The `.local` domain is reserved: nothing is ever emailed there (lib/email.ts),
 * the register route refuses it, and UIs show "Facebook account" instead.
 *
 * Dependency-free so client components and lib/email.ts can import it.
 */
export const SYNTHETIC_EMAIL_DOMAIN = 'users.congrats.local';

export type OAuthProviderId = 'google' | 'facebook';

const PROVIDER_PREFIX: Record<OAuthProviderId, string> = { google: 'google', facebook: 'fb' };

/** Stable placeholder address for a provider account. */
export function syntheticEmail(provider: OAuthProviderId, providerAccountId: string): string {
  const id = String(providerAccountId ?? '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!id) throw new Error('providerAccountId is required');
  return `${PROVIDER_PREFIX[provider]}-${id}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/** True for placeholder addresses that must never receive email or be shown as an email. */
export function isSyntheticEmail(email: string | null | undefined): boolean {
  return typeof email === 'string' && email.trim().toLowerCase().endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`);
}
