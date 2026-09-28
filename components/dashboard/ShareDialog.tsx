'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Dialog, Button } from '@/components/ui';
import { ShareQr } from './ShareQr';

/** Builds the absolute /[locale]/p/[slug] share URL for the current origin. */
export function buildShareUrl(locale: string, slug: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/${locale}/p/${slug}`;
}

export function ShareDialog({
  open,
  onClose,
  slug,
  recipientName,
}: {
  open: boolean;
  onClose: () => void;
  slug: string | null;
  recipientName?: string | null;
}) {
  const t = useTranslations('dashboard.share');
  const locale = useLocale();
  const [copied, setCopied] = React.useState(false);

  const url = slug ? buildShareUrl(locale, slug) : '';

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  const waText = encodeURIComponent(`${t('whatsappText')}${url}`);
  const waHref = `https://wa.me/?text=${waText}`;

  return (
    <Dialog open={open} onClose={onClose} title={t('title')}>
      <p className="-mt-token-2 mb-token-4 text-sm text-muted">{t('subtitle')}</p>

      {slug ? (
        <div className="flex flex-col gap-token-4">
          <div className="flex flex-col items-center gap-token-2">
            <ShareQr value={url} label={t('qr')} />
            <p className="text-xs text-muted">{t('qrHint')}</p>
          </div>
          <div className="flex items-center gap-token-2 rounded-md border border-border bg-surface-2 px-token-3 py-token-2">
            <span className="truncate text-sm text-ink" dir="ltr">
              {url}
            </span>
          </div>

          <div className="flex flex-col gap-token-2">
            <Button onClick={copy} variant="secondary" className="w-full">
              {copied ? t('copied') : t('copy')}
            </Button>
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <Button className="w-full">
                <span aria-hidden>🟢</span> {t('whatsapp')}
              </Button>
            </a>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-center">
              <Button variant="ghost" className="w-full">
                {t('open')}
              </Button>
            </a>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">{t('notReady')}</p>
      )}
    </Dialog>
  );
}
