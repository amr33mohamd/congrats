/** Client-side email check for the auth forms; returns a common.auth message key. */
export function validateEmail(email: string): 'emailRequired' | 'emailInvalid' | null {
  const v = email.trim();
  if (!v) return 'emailRequired';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'emailInvalid';
}
