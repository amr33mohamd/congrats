'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, Input } from '@/components/ui';
import { AuthShell, AuthField } from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const t = useTranslations('common.auth');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        <form onSubmit={onSubmit} className="flex flex-col gap-token-4">
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
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? t('working') : t('forgotSubmit')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
