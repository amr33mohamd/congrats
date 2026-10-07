/**
 * Which one-tap providers are switched on. Each needs both its id and secret;
 * without them the button is hidden and the provider is not registered, so the
 * app runs fine on email+password alone.
 */
export interface EnabledProviders {
  google: boolean;
  facebook: boolean;
}

const has = (v: string | undefined) => Boolean(v && v.trim());

export function enabledOAuthProviders(env: Record<string, string | undefined> = process.env): EnabledProviders {
  return {
    google: has(env.AUTH_GOOGLE_ID) && has(env.AUTH_GOOGLE_SECRET),
    facebook: has(env.AUTH_FACEBOOK_ID) && has(env.AUTH_FACEBOOK_SECRET),
  };
}
