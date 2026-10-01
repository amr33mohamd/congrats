// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { attribution, visitorId } from './track';
import { scrubPath } from './track-events';

beforeEach(() => localStorage.clear());

describe('attribution', () => {
  it('remembers the ad touch for later visits without utm', () => {
    expect(attribution('?utm_source=facebook&utm_campaign=wedding')).toMatchObject({ source: 'facebook', campaign: 'wedding' });
    expect(attribution('')).toMatchObject({ source: 'facebook', campaign: 'wedding' });
  });
  it('credits a bare fbclid to paid facebook', () => {
    expect(attribution('?fbclid=abc')).toMatchObject({ source: 'facebook', medium: 'paid' });
  });
  it('is direct with no touch', () => {
    expect(attribution('')).toBeUndefined();
  });
});

it('keeps one visitor id per browser', () => {
  const id = visitorId();
  expect(id).toMatch(/^[A-Za-z0-9-]{8,64}$/);
  expect(visitorId()).toBe(id);
});

it('scrubs card slugs and private ids from paths', () => {
  expect(scrubPath('/ar/p/ahmed-sara')).toBe('/ar/p/:card');
  expect(scrubPath('/en/builder/123e4567-e89b-12d3-a456-426614174000')).toBe('/en/builder/:id');
  expect(scrubPath('/en/templates')).toBe('/en/templates');
});
