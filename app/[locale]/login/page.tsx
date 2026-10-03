'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { Button, Input } from '@/components/ui';
import { track } from '@/lib/track';
import { validateEmail } from '@/lib/validate-email';

type Mode = 'login' | 'signup';

function LoginForm() {
  const t = useTranslations('common.auth');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const params = useSearchParams();
  // Where to go after signing in — local paths only, never another site.
  const rawNext = params.get('next') ?? '';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('\\') ? rawNext : '/dashboard';
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Our own messages instead of the browser's (English-only) bubbles.
    const emailError = validateEmail(email);
    if (emailError) {
      setError(t(emailError));
      return;
    }
    if (!password) {
      setError(t('passwordRequired'));
      return;
    }
    if (password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            displayName: name.trim() || undefined,
            locale: locale === 'ar' ? 'ar' : 'en',
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error?.code === 'CONFLICT' ? t('emailTaken') : t('genericError'));
          setLoading(false);
          return;
        }
        track('signup');
      }

      const result = await signIn('password', { email, password, redirect: false });
      if (!result || result.error) {
        setError(t('invalidCredentials'));
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError(t('genericError'));
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
            <p className="font-heading text-3xl font-extrabold leading-tight">
              {tc('app.tagline')}
            </p>
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

          <form noValidate onSubmit={onSubmit} className="mt-token-6 flex flex-col gap-token-4">
            {isSignup ? (
              <Field label={t('nameLabel')}>
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder={t('namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            ) : null}

            <Field label={t('emailLabel')}>
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label={t('passwordLabel')}>
              <Input
                type="password"
                required
                minLength={8}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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

            <Button type="submit" size="lg" disabled={loading} className="mt-token-1">
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
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-token-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

/** useSearchParams (for ?next= / ?mode=) needs a Suspense boundary on a static page. */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
