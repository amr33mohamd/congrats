'use client';

/**
 * Payment screenshot viewer with zoom + rotate controls. The image is the
 * signed payment-proof URL minted by the backend (B2). Degrades to a neutral
 * placeholder when no proof is attached.
 */
import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';

export function PaymentProofViewer({ url }: { url: string | null | undefined }) {
  const t = useTranslations('admin');
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  if (!url) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border bg-surface-2 text-sm text-muted">
        {t('queue.drawer.noProof')}
      </div>
    );
  }

  return (
    <div>
      <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-md border border-border bg-backdrop">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={t('queue.drawer.proof')}
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
        />
      </div>
      <div className="mt-token-2 flex flex-wrap items-center gap-token-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
          aria-label={t('queue.drawer.zoomIn')}
        >
          ＋
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
          aria-label={t('queue.drawer.zoomOut')}
        >
          －
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          aria-label={t('queue.drawer.rotate')}
        >
          ↻
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setZoom(1);
            setRotation(0);
          }}
        >
          {t('queue.drawer.reset')}
        </Button>
        <span className="text-xs text-muted">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
