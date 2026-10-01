'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button, Spinner } from '@/components/ui';
import { uploadAndConfirm, dashboardApi } from './api-client';
import type { LocalMedia } from './editor-state';

/**
 * Gallery (multi-photo) slot uploader. Holds up to `max` photos, all stored as
 * separate LocalMedia under the SAME slot key. Each upload is tagged with the
 * stable scene id (`templateStepId`) + `slotKey` so the binder surfaces them in
 * the gallery scene in upload order. Add and remove (best-effort DB delete) are
 * supported; single-photo slots use ImageUpload instead.
 */
export function MultiImageUpload({
  values,
  experienceId,
  templateStepId,
  slotKey,
  aspect,
  max,
  onAdd,
  onRemoveAt,
}: {
  values: LocalMedia[];
  experienceId: string;
  templateStepId: string;
  slotKey: string;
  aspect?: string;
  max: number;
  onAdd: (media: LocalMedia) => void;
  onRemoveAt: (indexInSlot: number) => void;
}) {
  const t = useTranslations('dashboard.wizard.content');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  const atMax = values.length >= max;
  const pick = () => inputRef.current?.click();

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setBusy(true);
    // Respect the slot's max across the existing + newly picked photos.
    const room = Math.max(0, max - values.length);
    for (const file of files.slice(0, room)) {
      try {
        const media = await uploadAndConfirm(file, {
          kind: 'step_image',
          experienceId,
          templateStepId,
          slotKey,
        });
        onAdd({
          slot: slotKey,
          url: media.url,
          mediaId: media.id,
          width: media.width,
          height: media.height,
        });
      } catch {
        // Fall back to an optimistic local preview so the user still sees it.
        onAdd({ slot: slotKey, url: URL.createObjectURL(file) });
      }
    }
    setBusy(false);
  };

  const remove = (indexInSlot: number, mediaId?: string) => {
    if (mediaId) {
      dashboardApi.deleteMedia(mediaId).catch(() => {
        /* orphan rows are harmless */
      });
    }
    onRemoveAt(indexInSlot);
  };

  const aspectClass =
    aspect === '16:9' ? 'aspect-video' : aspect === '3:4' ? 'aspect-[3/4]' : 'aspect-square';

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={onFiles}
        aria-label={t('addPhoto')}
      />

      <div className="grid grid-cols-3 gap-token-2">
        {values.map((m, i) => (
          <div
            key={m.mediaId ?? `${slotKey}-${i}`}
            className={`group relative overflow-hidden rounded-lg border border-border ${aspectClass}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i, m.mediaId)}
              aria-label={t('remove')}
              className="absolute end-token-1 top-token-1 rounded-full bg-black/60 px-token-2 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}

        {!atMax ? (
          <button
            type="button"
            onClick={pick}
            disabled={busy}
            className={`flex ${aspectClass} flex-col items-center justify-center gap-token-1 rounded-lg border border-dashed border-border bg-surface-2 text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-60`}
          >
            {busy ? <Spinner size={18} /> : <span aria-hidden className="text-xl">＋</span>}
            <span className="text-xs font-medium">{busy ? t('uploading') : t('addPhoto')}</span>
          </button>
        ) : null}
      </div>

      <p className="mt-token-2 text-xs text-muted">
        {t('photoCount', { count: values.length, max })}
      </p>
    </div>
  );
}
