import { describe, it, expect } from 'vitest';
import { safeMapsUrl } from './InvitationScenes';

describe('safeMapsUrl', () => {
  it('accepts real Google Maps links', () => {
    for (const u of [
      'https://maps.app.goo.gl/abc123',
      'https://goo.gl/maps/xyz',
      'https://www.google.com/maps/place/Cairo',
      'https://google.com.eg/maps?q=1',
      'https://maps.google.com/?q=cairo',
    ]) expect(safeMapsUrl(u), u).toBe(true);
  });
  it('rejects look-alike and non-https hosts', () => {
    for (const u of [
      'https://maps.app.goo.gl.evil.com/x',
      'https://google.evil.com/maps',
      'https://www.google.com.evil.io/maps',
      'https://goo.gl/phish',
      'http://maps.app.goo.gl/abc',
      'javascript:alert(1)',
      'https://user@maps.app.goo.gl/x',
      '',
    ]) expect(safeMapsUrl(u), u).toBe(false);
  });
});
