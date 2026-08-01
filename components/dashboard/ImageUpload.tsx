'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button, Spinner } from '@/components/ui';
import { uploadAndConfirm, dashboardApi } from './api-client';
import type { LocalMedia } from './editor-state';

/**
 * Single-photo slot uploader. The uploaded media is tagged with the stable
 * scene id (`templateStepId`) + `slotKey` so the binder files it under the
 * right slot and it survives step-row replacement. Replacing/removing a photo
 * best-effort deletes the previous media row so a slot never accrues orphans.
 */
export function ImageUpload({
  value,
  experienceId,
  templateStepId,
  slotKey,
  aspect,
  onChange,
}: {
  value?: LocalMedia;
  experienceId: string;
  templateStepId: string;
  slotKey: string;
  aspect?: string;
  onChange: (media: LocalMedia | null) => void;
}) {
  const t = useTranslations('dashboard.wizard.content');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [localUrl, setLocalUrl] = React.useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const deletePrevious = async (mediaId?: string) => {
    if (!mediaId) return;
    try {
      await dashboardApi.deleteMedia(mediaId);
    } catch {
      /* orphan rows are harmless; the new media binds under the same slot */
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(false);
    setBusy(true);
    // Optimistic local preview.
    const preview = URL.createObjectURL(file);
    setLocalUrl(preview);
    const previousMediaId = value?.mediaId;
    try {
      const media = await uploadAndConfirm(file, {
        kind: 'experience-media',
        experienceId,
        templateStepId,
        slotKey,
      });
      await deletePrevious(previousMediaId);
      onChange({
        slot: slotKey,
        url: media.url,
        mediaId: media.id,
        width: media.width,
        height: media.height,
      });
    } catch {
      // Keep the local preview so the user still sees their image in the editor.
      onChange({ slot: slotKey, url: preview });
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const shown = value?.url ?? localUrl;
  const aspectClass = aspect === '1:1' ? 'aspect-square' : aspect === '16:9' ? 'aspect-video' : 'aspect-[3/4]';

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFile}
        aria-label={t('upload')}
      />
      {shown ? (
        <div className="flex items-start gap-token-3">
          <div className={`relative w-24 overflow-hidden rounded-lg border border-border ${aspectClass}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown} alt="" className="h-full w-full object-cover" />
            {busy ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Spinner size={18} />
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-token-2">
            <Button size="sm" variant="secondary" onClick={pick} disabled={busy}>
              {t('replace')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void deletePrevious(value?.mediaId);
                setLocalUrl(null);
                onChange(null);
              }}
              disabled={busy}
            >
              {t('remove')}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          className="flex w-full flex-col items-center justify-center gap-token-2 rounded-lg border border-dashed border-border bg-surface-2 p-token-6 text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
        >
          {busy ? <Spinner size={20} /> : <span aria-hidden className="text-2xl">🖼️</span>}
          <span className="text-sm font-medium">{busy ? t('uploading') : t('upload')}</span>
        </button>
      )}
      {error ? <p className="mt-token-2 text-xs text-warning">{t('uploading')}</p> : null}
    </div>
  );
}
