'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

/** A labelled value with a copy-to-clipboard button. Direction-safe. */
export function CopyField({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const t = useTranslations('dashboard.checkout');
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-token-3">
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-token-1 flex items-center justify-between gap-token-3">
        <span className={`truncate text-base font-semibold text-ink ${mono ? 'font-mono' : ''}`} dir="ltr">
          {value}
        </span>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-md border border-border bg-surface px-token-3 py-token-1 text-xs font-medium text-ink transition-colors hover:bg-surface-2"
        >
          {copied ? t('copied') : t('copy')}
        </button>
      </div>
    </div>
  );
}
