import { describe, it, expect, afterEach } from 'vitest';
import { clientIp } from './rate-limit';

const req = (headers: Record<string, string>) => new Request('http://x/', { headers });

describe('clientIp', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('ignores the client-controlled left-most XFF entry', () => {
    delete process.env.FLY_APP_NAME;
    delete process.env.TRUSTED_PROXY_HOPS;
    expect(clientIp(req({ 'x-forwarded-for': '1.2.3.4, 9.9.9.9' }))).toBe('9.9.9.9');
    expect(clientIp(req({ 'x-forwarded-for': '9.9.9.9' }))).toBe('9.9.9.9');
  });

  it('honours TRUSTED_PROXY_HOPS', () => {
    delete process.env.FLY_APP_NAME;
    process.env.TRUSTED_PROXY_HOPS = '2';
    expect(clientIp(req({ 'x-forwarded-for': 'spoof, 5.5.5.5, 10.0.0.1' }))).toBe('5.5.5.5');
    process.env.TRUSTED_PROXY_HOPS = '0';
    expect(clientIp(req({ 'x-forwarded-for': 'spoof' }))).toBe('local');
  });

  it('uses Fly-Client-IP only on Fly', () => {
    process.env.FLY_APP_NAME = 'congrats';
    expect(clientIp(req({ 'fly-client-ip': '7.7.7.7', 'x-forwarded-for': 'spoof, 7.7.7.7' }))).toBe('7.7.7.7');
    delete process.env.FLY_APP_NAME;
    delete process.env.TRUSTED_PROXY_HOPS;
    expect(clientIp(req({ 'fly-client-ip': 'spoof', 'x-forwarded-for': '8.8.8.8' }))).toBe('8.8.8.8');
  });
});
