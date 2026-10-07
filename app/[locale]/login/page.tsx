import { headers } from 'next/headers';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/auth/LoginForm';
import { enabledOAuthProviders } from '@/lib/auth-providers';
import { blocksGoogleOAuth } from '@/lib/in-app-browser';
import { safeNextPath } from '@/lib/safe-next';
import { supportWhatsappHref, SITE_URL } from '@/lib/site';
import { absolutePageUrl } from '@/lib/support-inquiry';

/**
 * Sign in / sign up. Server part: decides which one-tap providers to show
 * (only those configured), whether Google must be disabled because this is
 * Facebook/Messenger/Instagram's in-app browser (Google blocks OAuth there),
 * and builds the WhatsApp help link quoting the page the visitor was headed to.
 */
type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Auth.js `?error=` after a failed OAuth round trip → which message to show. */
function oauthErrorKind(error: string | undefined): 'denied' | 'failed' | null {
  if (!error || error === 'CredentialsSignin') return null;
  return error === 'AccessDenied' ? 'denied' : 'failed';
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const ua = (await headers()).get('user-agent');
  const t = await getTranslations({ locale, namespace: 'auth' });

  const next = safeNextPath(sp.next);
  const whatsappMessage = t('help.messagePage', { url: absolutePageUrl(SITE_URL, locale, next) });

  return (
    <LoginForm
      // Re-mount when ?mode= changes so a "sign up" link from the header works
      // even while the login form is already open.
      key={first(sp.mode) === 'signup' ? 'signup' : 'login'}
      next={next}
      initialMode={first(sp.mode) === 'signup' ? 'signup' : 'login'}
      providers={enabledOAuthProviders()}
      googleBlocked={blocksGoogleOAuth(ua)}
      oauthError={oauthErrorKind(first(sp.error))}
      whatsappHref={supportWhatsappHref()}
      whatsappMessage={whatsappMessage}
    />
  );
}
