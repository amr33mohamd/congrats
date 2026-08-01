/**
 * Password hashing helpers. Uses bcryptjs (pure-JS, no native build) so it runs
 * identically in dev, Docker (node:slim), and serverless. Hashes are stored in
 * users.password_hash; never log or return them.
 */
import bcrypt from 'bcryptjs';

const ROUNDS = 12;

/**
 * A fixed valid bcrypt hash used to spend equal time when an account is NOT
 * found, so login response timing can't distinguish registered from
 * unregistered emails (user enumeration). It matches no real password.
 */
export const DUMMY_PASSWORD_HASH = '$2a$12$ZA5TFlP0XAI7/2nzs40Cy.Yb1KCm/WuMie0iCwrn5XJXgdN9eb8r2';

/** Minimum policy enforced at signup and password change. */
export const PASSWORD_MIN_LENGTH = 8;

export function passwordPolicyError(password: string): string | null {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > 200) return 'Password is too long.';
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

/** Constant-time compare. Returns false for empty/missing hashes. */
export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
