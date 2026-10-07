import { describe, expect, it } from 'vitest';
import { blocksGoogleOAuth, isMetaInAppBrowser } from './in-app-browser';
import { enabledOAuthProviders } from './auth-providers';
import { safeNextPath } from './safe-next';
import { absolutePageUrl } from './support-inquiry';

const UA = {
  fbAndroid:
    'Mozilla/5.0 (Linux; Android 13; SM-A135F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/447.0.0.40.110;]',
  fbIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/446.0.0.38.112;FBBV/565048396;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.2;FBSS/3;FBID/phone;FBLC/ar_AR;FBOP/5]',
  messengerIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 LightSpeed [FBAN/MessengerLiteForiOS;FBAV/430.0.0.30.106;FBBV/1;FBDV/iPhone12,1;FBMD/iPhone;FBSN/iOS;FBSV/16.6]',
  messengerAndroid:
    'Mozilla/5.0 (Linux; Android 12; Redmi Note 11 Build/SKQ1.211103.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.193 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/437.0.0.20.111;]',
  instagram:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 307.0.0.34.111 (iPhone13,2; iOS 17_1; ar_EG; ar; scale=3.00; 1170x2532; 531295143)',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  safariIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  desktopChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

describe('in-app browser detection', () => {
  it.each(['fbAndroid', 'fbIos', 'messengerIos', 'messengerAndroid', 'instagram'] as const)(
    'flags %s as a Meta in-app browser that blocks Google',
    (k) => {
      expect(isMetaInAppBrowser(UA[k])).toBe(true);
      expect(blocksGoogleOAuth(UA[k])).toBe(true);
    },
  );

  it.each(['chromeAndroid', 'safariIos', 'desktopChrome'] as const)('lets Google through on %s', (k) => {
    expect(isMetaInAppBrowser(UA[k])).toBe(false);
    expect(blocksGoogleOAuth(UA[k])).toBe(false);
  });

  it('treats a missing user agent as a normal browser', () => {
    expect(blocksGoogleOAuth(null)).toBe(false);
    expect(blocksGoogleOAuth('')).toBe(false);
    expect(isMetaInAppBrowser(undefined)).toBe(false);
  });
});

describe('enabledOAuthProviders', () => {
  it('needs both id and secret', () => {
    expect(enabledOAuthProviders({})).toEqual({ google: false, facebook: false });
    expect(enabledOAuthProviders({ AUTH_GOOGLE_ID: 'x' })).toEqual({ google: false, facebook: false });
    expect(
      enabledOAuthProviders({ AUTH_GOOGLE_ID: 'x', AUTH_GOOGLE_SECRET: 'y', AUTH_FACEBOOK_ID: 'a', AUTH_FACEBOOK_SECRET: ' ' }),
    ).toEqual({ google: true, facebook: false });
    expect(enabledOAuthProviders({ AUTH_FACEBOOK_ID: 'a', AUTH_FACEBOOK_SECRET: 'b' })).toEqual({ google: false, facebook: true });
  });
});

describe('safeNextPath', () => {
  it('keeps local paths and rejects everything else', () => {
    expect(safeNextPath('/builder?template=abc')).toBe('/builder?template=abc');
    expect(safeNextPath(['/dashboard/x', '/y'])).toBe('/dashboard/x');
    expect(safeNextPath(undefined)).toBe('/dashboard');
    expect(safeNextPath('https://evil.example')).toBe('/dashboard');
    expect(safeNextPath('//evil.example')).toBe('/dashboard');
    expect(safeNextPath('/\\evil.example')).toBe('/dashboard');
    expect(safeNextPath('/\t/evil.example')).toBe('/dashboard');
  });
});

describe('absolutePageUrl', () => {
  it('builds absolute page urls', () => {
    expect(absolutePageUrl('https://site.test/', 'ar', '/t/wedding')).toBe('https://site.test/ar/t/wedding');
    expect(absolutePageUrl('https://site.test', 'en', '/')).toBe('https://site.test/en');
  });
});
