import { describe, expect, it } from 'vitest';
import { closestSlug } from './closest-slug';

const categories = ['invitation', 'birthday', 'wedding', 'graduation'];
const designs = ['birthday-kol-sana-ar', 'invitation-tarab-velvet-ar', 'invitation-qasr-gold-ar'];

describe('closestSlug', () => {
  it('fixes a dropped letter', () => {
    expect(closestSlug('invitaton', categories)).toBe('invitation');
    expect(closestSlug('birthday-kol-saa-ar', designs)).toBe('birthday-kol-sana-ar');
    expect(closestSlug('invitation-tara-velvet-ar', designs)).toBe('invitation-tarab-velvet-ar');
  });

  it('is case-insensitive', () => {
    expect(closestSlug('Birthday', categories)).toBe('birthday');
  });

  it('gives up when nothing is close', () => {
    expect(closestSlug('something-else-entirely', designs)).toBeNull();
    expect(closestSlug('x', [])).toBeNull();
  });
});
