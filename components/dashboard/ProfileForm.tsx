'use client';

import * as React from 'react';
import { signOut } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { Button, Input, Card, CardTitle, Spinner } from '@/components/ui';

interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  locale: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}

export function ProfileForm() {
  const t = useTranslations('common.profile');
  const ta = useTranslations('common.auth');
  const locale = useLocale();

  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [name, setName] = React.useState('');
  const [userLocale, setUserLocale] = React.useState('ar');
  const [avatar, setAvatar] = React.useState('');
  const [savedMsg, setSavedMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [pwMsg, setPwMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pwSaving, setPwSaving] = React.useState(false);

  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/dashboard/profile');
        if (!res.ok) throw new Error('failed');
        const { user } = (await res.json()) as { user: Profile };
        setProfile(user);
        setName(user.displayName ?? '');
        setUserLocale(user.locale);
        setAvatar(user.avatarUrl ?? '');
      } catch {
        setLoadError(true);
      }
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: name.trim() || undefined,
          locale: userLocale === 'ar' ? 'ar' : 'en',
          avatarUrl: avatar.trim() ? avatar.trim() : null,
        }),
      });
      setSavedMsg(res.ok ? { ok: true, text: t('saved') } : { ok: false, text: ta('genericError') });
    } catch {
      setSavedMsg({ ok: false, text: ta('genericError') });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (next.length < 8) {
      setPwMsg({ ok: false, text: ta('passwordTooShort') });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch('/api/dashboard/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (res.ok) {
        setPwMsg({ ok: true, text: t('passwordChanged') });
        setCurrent('');
        setNext('');
      } else {
        setPwMsg({ ok: false, text: t('passwordWrong') });
      }
    } finally {
      setPwSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-token-8">
        {loadError ? <p className="text-sm text-danger">{ta('genericError')}</p> : <Spinner />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-token-6">
        <h1 className="font-heading text-2xl font-bold text-ink md:text-3xl">{t('title')}</h1>
        <p className="mt-token-1 text-muted">{t('subtitle')}</p>
      </div>

      {/* Account details */}
      <Card className="mb-token-6">
        <form onSubmit={saveProfile} className="flex flex-col gap-token-4">
          <Field label={t('emailLabel')} hint={t('emailHint')}>
            <Input type="email" value={profile.email} disabled />
          </Field>
          <Field label={t('nameLabel')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </Field>
          <Field label={t('localeLabel')}>
            <div className="flex gap-token-2">
              {(['ar', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setUserLocale(l)}
                  className={`flex-1 rounded-md border px-token-3 py-token-2 text-sm font-medium transition-colors ${
                    userLocale === l ? 'border-brand bg-brand/10 text-brand-strong' : 'border-border text-muted hover:bg-surface-2'
                  }`}
                >
                  {l === 'ar' ? t('localeAr') : t('localeEn')}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t('avatarLabel')}>
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder={t('avatarPlaceholder')} />
          </Field>
          <div className="flex items-center gap-token-3">
            <Button type="submit" disabled={saving}>
              {saving ? '…' : t('save')}
            </Button>
            {savedMsg ? (
              <span className={`text-sm ${savedMsg.ok ? 'text-success' : 'text-danger'}`}>{savedMsg.text}</span>
            ) : null}
          </div>
        </form>
      </Card>

      {/* Change password */}
      <Card className="mb-token-6">
        <CardTitle className="mb-token-4">{t('passwordSection')}</CardTitle>
        <form onSubmit={changePassword} className="flex flex-col gap-token-4">
          <Field label={t('currentPassword')}>
            <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <Field label={t('newPassword')}>
            <Input type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          {pwMsg ? <span className={`text-sm ${pwMsg.ok ? 'text-success' : 'text-danger'}`}>{pwMsg.text}</span> : null}
          <div>
            <Button type="submit" variant="secondary" disabled={pwSaving}>
              {pwSaving ? '…' : t('changePassword')}
            </Button>
          </div>
        </form>
      </Card>

      <Button variant="ghost" onClick={() => signOut({ callbackUrl: `/${locale}/login` })}>
        {t('logout')}
      </Button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-token-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
