'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, Spinner, Dialog } from '@/components/ui';
import { dashboardApi } from './api-client';
import type { ExperienceListItem } from './types';
import { ExperienceCard } from './ExperienceCard';
import { ShareDialog } from './ShareDialog';

export function ExperienceList() {
  const t = useTranslations('dashboard');

  const [items, setItems] = React.useState<ExperienceListItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [shareItem, setShareItem] = React.useState<ExperienceListItem | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<ExperienceListItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const list = await dashboardApi.listExperiences();
      setItems(list);
    } catch {
      setItems([]);
      setError(t('errors.loadFailed'));
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Arriving from an approved order (?share=<experienceId>): open that card's
  // share dialog straight away. Read once from the URL rather than
  // useSearchParams so the page needs no Suspense boundary.
  const autoShared = React.useRef(false);
  React.useEffect(() => {
    if (!items || autoShared.current) return;
    autoShared.current = true;
    const id = new URLSearchParams(window.location.search).get('share');
    const match = id ? items.find((x) => x.id === id) : undefined;
    if (match) setShareItem(match);
  }, [items]);

  const confirmDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await dashboardApi.deleteExperience(deleteItem.id);
      setItems((prev) => (prev ?? []).filter((x) => x.id !== deleteItem.id));
      setDeleteItem(null);
    } catch {
      setError(t('errors.loadFailed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-token-6 flex flex-wrap items-end justify-between gap-token-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink md:text-3xl">
            {t('list.title')}
          </h1>
          <p className="mt-token-1 text-muted">{t('list.subtitle')}</p>
        </div>
        <Link href="/builder">
          <Button>
            <span aria-hidden>＋</span> {t('list.createCta')}
          </Button>
        </Link>
      </div>

      {error ? (
        <div className="mb-token-4 rounded-md border border-danger/30 bg-danger/10 px-token-4 py-token-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {items === null ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-token-8 text-center">
          <span aria-hidden className="text-5xl">🎈</span>
          <h2 className="mt-token-4 font-heading text-xl font-semibold text-ink">
            {t('list.empty.title')}
          </h2>
          <p className="mt-token-2 max-w-sm text-muted">{t('list.empty.body')}</p>
          <Link href="/builder" className="mt-token-6">
            <Button size="lg">{t('list.empty.cta')}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-token-4 sm:grid-cols-2">
          {items.map((item) => (
            <ExperienceCard
              key={item.id}
              item={item}
              onShare={setShareItem}
              onDelete={setDeleteItem}
            />
          ))}
        </div>
      )}

      <ShareDialog
        open={Boolean(shareItem)}
        onClose={() => setShareItem(null)}
        slug={shareItem?.shareSlug ?? shareItem?.slug ?? null}
        recipientName={shareItem?.recipientName}
      />

      <Dialog
        open={Boolean(deleteItem)}
        onClose={() => (deleting ? undefined : setDeleteItem(null))}
        title={t('card.deleteConfirmTitle')}
      >
        <p className="mb-token-6 text-sm text-muted">{t('card.deleteConfirmBody')}</p>
        <div className="flex justify-end gap-token-2">
          <Button variant="ghost" onClick={() => setDeleteItem(null)} disabled={deleting}>
            {t('card.deleteCancel')}
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? <Spinner size={16} /> : t('card.deleteConfirm')}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
