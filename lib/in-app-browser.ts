/**
 * In-app browser detection. Google refuses OAuth inside embedded webviews
 * ("Error 403: disallowed_useragent"), and most of our visitors arrive from
 * Facebook, Messenger or Instagram links, which open in exactly such a
 * webview. Facebook login and email+password still work there.
 */
const META_IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|FB4A|MessengerForiOS|MessengerLite|Orca-Android|Messenger|Instagram/i;
// Other common embedded webviews that Google also blocks.
const OTHER_IN_APP = /\bLine\/|musical_ly|BytedanceWebview|TikTok|Snapchat|LinkedInApp/i;

/** True inside Facebook / Messenger / Instagram's built-in browser. */
export function isMetaInAppBrowser(ua: string | null | undefined): boolean {
  return typeof ua === 'string' && META_IN_APP.test(ua);
}

/** True where Google OAuth is known to fail with disallowed_useragent. */
export function blocksGoogleOAuth(ua: string | null | undefined): boolean {
  if (typeof ua !== 'string' || !ua) return false;
  return META_IN_APP.test(ua) || OTHER_IN_APP.test(ua);
}
