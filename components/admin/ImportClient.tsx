'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

type Result = {
  imported: number;
  skippedExisting: number;
  skippedUnknownTemplate: string[];
  linksKept: number;
  linksDropped: number;
};

/** Upload a cards export (db/export-cards.ts) into the signed-in admin's account. */
export function ImportClient() {
  const t = useTranslations('admin.import');
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: await file.text(),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message ?? body?.message ?? `HTTP ${res.status}`);
      setResult(body as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-heading text-2xl font-bold text-ink">{t('title')}</h1>
      <p className="mt-token-2 text-sm text-muted">{t('hint')}</p>
      <label className="mt-token-6 block rounded-xl border border-dashed border-border bg-surface p-token-6 text-center text-sm text-ink">
        <input
          type="file"
          accept="application/json,.json"
          aria-label={t('choose')}
          className="block w-full text-sm"
          disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {busy ? <span className="mt-token-2 block text-muted">{t('working')}</span> : null}
      </label>
      {error ? (
        <p role="alert" className="mt-token-4 rounded-md bg-danger/10 px-token-3 py-token-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {result ? (
        <ul data-testid="import-result" className="mt-token-4 space-y-1 rounded-md bg-surface-2 px-token-4 py-token-3 text-sm text-ink">
          <li>{t('imported', { count: result.imported })}</li>
          <li>{t('existing', { count: result.skippedExisting })}</li>
          <li>{t('links', { kept: result.linksKept, dropped: result.linksDropped })}</li>
          {result.skippedUnknownTemplate.length ? (
            <li>{t('unknown', { names: result.skippedUnknownTemplate.join('، ') })}</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
