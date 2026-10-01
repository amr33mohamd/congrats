'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, Input } from '@/components/ui';
import { AuthShell, AuthField } from '@/components/auth/AuthShell';

function ResetForm() {
  const t = useTranslations('common.auth');
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        setError(t('resetInvalid'));
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError(t('genericError'));
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title={t('resetTitle')} subtitle={t('resetSubtitle')}
        footer={<Link href="/forgot" className="font-semibold text-brand-strong hover:underline">{t('forgotTitle')}</Link>}>
        <p className="rounded-md border border-danger/30 bg-danger/10 px-token-4 py-token-3 text-sm text-danger">
          {t('resetInvalid')}
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('resetTitle')}
      subtitle={t('resetSubtitle')}
      footer={<Link href="/login" className="font-semibold text-brand-strong hover:underline">{t('backToLogin')}</Link>}
    >
      {done ? (
        <p role="status" className="rounded-md border border-success/30 bg-success/10 px-token-4 py-token-3 text-sm text-success">
          {t('resetDone')}
        </p>
      ) : (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-token-4">
          <AuthField label={t('newPasswordLabel')}>
            <Input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </AuthField>
          {error ? (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-token-3 py-token-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? t('working') : t('resetSubmit')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
