'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, Badge, Card } from '@/components/ui';
import type { ExperienceListItem } from './types';
import { deriveStatus, statusTone } from './status';

export function ExperienceCard({
  item,
  onShare,
  onDelete,
}: {
  item: ExperienceListItem;
  onShare: (item: ExperienceListItem) => void;
  onDelete: (item: ExperienceListItem) => void;
}) {
  const t = useTranslations('dashboard');
  const status = deriveStatus(item);
  const recipient = item.recipientName?.trim();
  const slug = item.shareSlug ?? item.slug ?? null;

  const cover = item.coverImageUrl;
  const palette = ['#F0436E', '#AE1F44'];

  return (
    <Card className="flex flex-col gap-token-4 p-token-4">
      <div className="flex items-start gap-token-4">
        <div
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg"
          style={{ background: `linear-gradient(150deg, ${palette[0]}, ${palette[1]})` }}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl" aria-hidden>
              💌
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-token-2">
            <h3 className="truncate font-heading text-base font-semibold text-ink">
              {item.title?.trim() || t('list.untitled')}
            </h3>
            <Badge tone={statusTone[status]}>{t(`status.${status}`)}</Badge>
          </div>
          <p className="mt-token-1 truncate text-sm text-muted">
            {t('list.recipient', { name: recipient || t('list.noRecipient') })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-token-2">
        {status === 'published' ? (
          <>
            <Button size="sm" variant="primary" onClick={() => onShare(item)}>
              <span aria-hidden>🔗</span> {t('card.share')}
            </Button>
            <Link href={`/builder/${item.id}`}>
              <Button size="sm" variant="secondary">
                {t('card.edit')}
              </Button>
            </Link>
          </>
        ) : status === 'awaiting_payment' || status === 'rejected' ? (
          <>
            {item.orderId ? (
              <Link href={`/orders/${item.orderId}`}>
                <Button size="sm" variant="primary">
                  {t('card.viewStatus')}
                </Button>
              </Link>
            ) : (
              <Link href={`/builder/${item.id}?step=review`}>
                <Button size="sm" variant="primary">
                  {t('card.checkout')}
                </Button>
              </Link>
            )}
            <Link href={`/builder/${item.id}`}>
              <Button size="sm" variant="ghost">
                {t('card.edit')}
              </Button>
            </Link>
          </>
        ) : status === 'locked' ? (
          <>
            {item.orderId ? (
              <Link href={`/orders/${item.orderId}`}>
                <Button size="sm" variant="primary">
                  {t('card.viewStatus')}
                </Button>
              </Link>
            ) : null}
            <Link href={`/builder/${item.id}`}>
              <Button size="sm" variant="ghost">
                {t('card.edit')}
              </Button>
            </Link>
          </>
        ) : (
          <Link href={`/builder/${item.id}`}>
            <Button size="sm" variant="primary">
              {t('card.continue')}
            </Button>
          </Link>
        )}

        <button
          type="button"
          onClick={() => onDelete(item)}
          className="ms-auto rounded-md px-token-2 py-token-1 text-sm font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger"
        >
          {t('card.delete')}
        </button>
      </div>

      {slug && status === 'published' ? (
        <p className="truncate text-xs text-muted" dir="ltr">
          /{item.locale}/p/{slug}
        </p>
      ) : null}
    </Card>
  );
}
