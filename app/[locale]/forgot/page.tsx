'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, Input } from '@/components/ui';
import { AuthShell, AuthField } from '@/components/auth/AuthShell';
import { validateEmail } from '@/lib/validate-email';

export default function ForgotPasswordPage() {
  const t = useTranslations('common.auth');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(t(emailError));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale: locale === 'ar' ? 'ar' : 'en' }),
      });
    } finally {
      // Always show the same confirmation (no account enumeration).
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t('forgotTitle')}
      subtitle={t('forgotSubtitle')}
      footer={<Link href="/login" className="font-semibold text-brand-strong hover:underline">{t('backToLogin')}</Link>}
    >
      {sent ? (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-token-4 py-token-3 text-sm text-success"
        >
          {t('forgotSent')}
        </p>
      ) : (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-token-4">
          <AuthField label={t('emailLabel')}>
            <Input
              type="email"
              required
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </AuthField>
          {error ? (
            <p
              role="alert"
              className="rounded-md border border-danger/30 bg-danger/10 px-token-3 py-token-2 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? t('working') : t('forgotSubmit')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
