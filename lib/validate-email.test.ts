import { expect, it } from 'vitest';
import { validateEmail } from './validate-email';

it('validates auth emails with our own messages', () => {
  expect(validateEmail('  ')).toBe('emailRequired');
  expect(validateEmail('amr@')).toBe('emailInvalid');
  expect(validateEmail('amr@example.com')).toBeNull();
});
