'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { Button, Input } from '@/components/ui';
import { WhatsAppCtaLink } from '@/components/marketing/WhatsAppButton';
import { track } from '@/lib/track';
import { validateEmail } from '@/lib/validate-email';
import { blocksGoogleOAuth } from '@/lib/in-app-browser';
import type { EnabledProviders } from '@/lib/auth-providers';

type Mode = 'login' | 'signup';
type OAuthId = 'google' | 'facebook';

export interface LoginFormProps {
  /** Local path to land on after signing in (already sanitised server-side). */
  next: string;
  initialMode: Mode;
  providers: EnabledProviders;
  /** Server-side user-agent check; re-checked in the browser. */
  googleBlocked: boolean;
  /** ?error= from Auth.js after a failed OAuth round trip. */
  oauthError: 'denied' | 'failed' | null;
  /** Support WhatsApp (wa.me) base link; null hides the help link. */
  whatsappHref: string | null;
  /** Prefilled message naming the page the visitor was headed to. */
  whatsappMessage: string;
}

export function LoginForm({ next, initialMode, providers, googleBlocked: blockedOnServer, oauthError, whatsappHref, whatsappMessage }: LoginFormProps) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<OAuthId | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthError === 'denied' ? t('errors.oauthDenied') : oauthError === 'failed' ? t('errors.oauthFailed') : null,
  );
  const [googleBlocked, setGoogleBlocked] = useState(blockedOnServer);

  useEffect(() => {
    // A cached render may not have seen this visitor's user agent.
    if (!blockedOnServer && blocksGoogleOAuth(navigator.userAgent)) setGoogleBlocked(true);
  }, [blockedOnServer]);

  const isSignup = mode === 'signup';
  const busy = loading || pendingProvider !== null;
  const hasOAuth = providers.google || providers.facebook;

  async function onOAuth(provider: OAuthId) {
    setError(null);
    setPendingProvider(provider);
    try {
      // Full-page redirect to the provider and back to `next`.
      await signIn(provider, { redirectTo: `/${locale}${next}` });
    } catch {
      setError(t('errors.oauthFailed'));
      setPendingProvider(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // Old in-app webviews without the clipboard API: let them copy by hand.
      window.prompt(t('copyLink'), window.location.href);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Our own messages instead of the browser's (English-only) bubbles.
    const emailError = validateEmail(email);
    if (emailError) {
      setError(t(`errors.${emailError}`));
      return;
    }
    if (!password) {
      setError(t('errors.passwordRequired'));
      return;
    }
    if (password.length < 8) {
      setError(t('errors.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
            displayName: name.trim() || undefined,
            locale: locale === 'ar' ? 'ar' : 'en',
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const code = data?.error?.code;
          const message = String(data?.error?.message ?? '');
          setError(
            code === 'CONFLICT'
              ? t('errors.emailTaken')
              : /too many/i.test(message)
                ? t('errors.tooManyAttempts')
                : /email/i.test(message)
                  ? t('errors.emailInvalid')
                  : t('errors.generic'),
          );
          setLoading(false);
          return;
        }
        track('signup');
      }

      const result = await signIn('password', { email: email.trim(), password, redirect: false });
      if (!result || result.error) {
        setError(t('errors.invalidCredentials'));
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError(typeof navigator !== 'undefined' && !navigator.onLine ? t('errors.network') : t('errors.generic'));
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-surface-2 p-token-4">
      {/* Ambient brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(50% 45% at 18% 8%, rgb(var(--c-brand-300) / 0.30), transparent 70%), radial-gradient(45% 45% at 92% 100%, rgb(var(--c-gold-300) / 0.22), transparent 70%)',
        }}
      />

      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-pop)] md:grid-cols-2">
        {/* Brand panel */}
        <aside
          className="relative hidden flex-col justify-between p-token-8 text-white md:flex"
          style={{ background: 'linear-gradient(150deg, rgb(var(--c-brand-700)), rgb(var(--c-brand-500)) 60%, rgb(var(--c-gold-500)))' }}
        >
          <div className="flex items-center gap-2 text-lg font-bold">
            <span aria-hidden className="text-2xl">🎉</span>
            Congrats
          </div>
          <div>
            <p className="font-heading text-3xl font-extrabold leading-tight">{t('tagline')}</p>
            <p className="mt-token-3 max-w-xs text-white/85">
              {isSignup ? t('signupSubtitle') : t('loginSubtitle')}
            </p>
          </div>
          <div className="flex gap-1.5" aria-hidden>
            {['🎂', '💍', '🌙', '🎓', '👶'].map((e) => (
              <span key={e} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-lg backdrop-blur-sm">
                {e}
              </span>
            ))}
          </div>
        </aside>

        {/* Form panel */}
        <div className="p-token-6 md:p-token-8">
          <h1 className="font-heading text-2xl font-bold text-ink">
            {isSignup ? t('signupTitle') : t('loginTitle')}
          </h1>
          <p className="mt-token-1 text-sm text-muted">
            {isSignup ? t('signupSubtitle') : t('loginSubtitle')}
          </p>

          {hasOAuth ? (
            <div className="mt-token-6 flex flex-col gap-token-3">
              {providers.google ? (
                googleBlocked ? (
                  <div className="rounded-lg border border-border bg-surface-2 p-token-3 text-sm" role="note">
                    <button
                      type="button"
                      disabled
                      aria-disabled
                      className="flex h-[3.25rem] w-full cursor-not-allowed items-center justify-center gap-token-3 rounded-lg border border-border bg-surface text-base font-semibold text-muted opacity-60"
                    >
                      <GoogleLogo />
                      {t('continueWithGoogle')}
                    </button>
                    <p className="mt-token-2 font-semibold text-ink">{t('googleInAppTitle')}</p>
                    <p className="mt-token-1 text-muted">{t('googleInAppHint')}</p>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="mt-token-2 font-semibold text-brand-strong underline-offset-2 hover:underline"
                    >
                      {copied ? t('linkCopied') : t('copyLink')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOAuth('google')}
                    disabled={busy}
                    className="flex h-[3.25rem] w-full items-center justify-center gap-token-3 rounded-lg border border-border bg-white text-base font-semibold text-[#1f1f1f] shadow-sm transition hover:bg-[#f7f8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
                  >
                    <GoogleLogo />
                    {pendingProvider === 'google' ? t('redirecting') : t('continueWithGoogle')}
                  </button>
                )
              ) : null}

              {providers.facebook ? (
                <button
                  type="button"
                  onClick={() => onOAuth('facebook')}
                  disabled={busy}
                  className="flex h-[3.25rem] w-full items-center justify-center gap-token-3 rounded-lg bg-[#1877F2] text-base font-semibold text-white shadow-sm transition hover:bg-[#166FE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  <FacebookLogo />
                  {pendingProvider === 'facebook' ? t('redirecting') : t('continueWithFacebook')}
                </button>
              ) : null}

              <div className="flex items-center gap-token-3 text-xs text-muted" aria-hidden>
                <span className="h-px flex-1 bg-border" />
                {t('orEmail')}
                <span className="h-px flex-1 bg-border" />
              </div>
            </div>
          ) : null}

          <form
            noValidate
            onSubmit={onSubmit}
            className={`${hasOAuth ? 'mt-token-3' : 'mt-token-6'} flex flex-col gap-token-4`}
          >
            {isSignup ? (
              <Field label={t('nameLabel')} hint={t('nameOptional')}>
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder={t('namePlaceholder')}
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            ) : null}

            <Field label={t('emailLabel')}>
              <Input
                type="email"
                inputMode="email"
                dir="ltr"
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label={t('passwordLabel')}>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pe-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? t('hidePasswordAria') : t('showPasswordAria')}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 end-0 flex items-center px-token-3 text-sm font-semibold text-brand-strong"
                >
                  {showPassword ? t('hidePassword') : t('showPassword')}
                </button>
              </div>
            </Field>

            {!isSignup ? (
              <Link href="/forgot" className="-mt-token-2 text-sm font-medium text-brand-strong hover:underline">
                {t('forgotLink')}
              </Link>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="rounded-md border border-danger/30 bg-danger/10 px-token-3 py-token-2 text-sm text-danger"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={busy} className="mt-token-1">
              {loading ? t('working') : isSignup ? t('signup') : t('login')}
            </Button>
          </form>

          <p className="mt-token-6 text-center text-sm text-muted">
            {isSignup ? t('haveAccount') : t('noAccount')}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? 'login' : 'signup');
                setError(null);
              }}
              className="font-semibold text-brand-strong underline-offset-2 hover:underline"
            >
              {isSignup ? t('switchToLogin') : t('switchToSignup')}
            </button>
          </p>

          {whatsappHref ? (
            <p className="mt-token-4 flex flex-wrap items-center justify-center gap-token-1 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 px-token-4 py-token-3 text-sm text-muted">
              {t('help.question')}
              <WhatsAppCtaLink
                href={whatsappHref}
                message={whatsappMessage}
                label={t('help.whatsapp')}
                source="login"
                className="font-bold text-[#128C4B] underline-offset-2 hover:underline"
              />
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-token-2">
      <span className="text-sm font-medium text-ink">
        {label}
        {hint ? <span className="ms-1 font-normal text-muted">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-current">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}
