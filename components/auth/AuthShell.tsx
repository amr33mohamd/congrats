'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

/**
 * Shared branded layout for the auth pages (forgot / reset). Mirrors the login
 * screen's split panel so the whole auth flow feels like one designed surface.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const tc = useTranslations('common');
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-surface-2 p-token-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(50% 45% at 18% 8%, rgb(var(--c-brand-300) / 0.30), transparent 70%), radial-gradient(45% 45% at 92% 100%, rgb(var(--c-gold-300) / 0.22), transparent 70%)',
        }}
      />
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-pop)] md:grid-cols-2">
        <aside
          className="relative hidden flex-col justify-between p-token-8 text-white md:flex"
          style={{ background: 'linear-gradient(150deg, rgb(var(--c-brand-700)), rgb(var(--c-brand-500)) 60%, rgb(var(--c-gold-500)))' }}
        >
          <div className="flex items-center gap-2 text-lg font-bold">
            <span aria-hidden className="text-2xl">🎉</span>
            Congrats
          </div>
          <div>
            <p className="font-heading text-3xl font-extrabold leading-tight">{tc('app.tagline')}</p>
            <p className="mt-token-3 max-w-xs text-white/85">{subtitle}</p>
          </div>
          <div className="flex gap-1.5" aria-hidden>
            {['🎂', '💍', '🌙', '🎓', '👶'].map((e) => (
              <span key={e} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-lg backdrop-blur-sm">
                {e}
              </span>
            ))}
          </div>
        </aside>

        <div className="p-token-6 md:p-token-8">
          <h1 className="font-heading text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-token-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-token-6">{children}</div>
          {footer ? <div className="mt-token-6 text-center text-sm text-muted">{footer}</div> : null}
        </div>
      </div>
    </main>
  );
}

export function AuthField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-token-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
