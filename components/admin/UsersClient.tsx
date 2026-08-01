'use client';

/**
 * Users list with block/unblock. Consumes GET /api/admin/users and
 * PATCH /api/admin/users/:id/block. Searchable by email/name.
 */
import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Button, Input } from '@/components/ui';
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
} from './primitives';
import { useApi, apiFetch, asList, formatDate } from './lib';
import type { UserRow } from './types';

export function UsersClient() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const { data, loading, error, reload } = useApi<unknown>('/api/admin/users');
  const [query, setQuery] = React.useState('');
  const [pending, setPending] = React.useState<string | null>(null);

  const users = React.useMemo(() => asList<UserRow>(data, 'users'), [data]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.displayName ?? '').toLowerCase().includes(q),
    );
  }, [users, query]);

  const toggleBlock = async (u: UserRow) => {
    const confirmMsg = u.isBlocked
      ? t('users.unblockConfirm')
      : t('users.blockConfirm');
    if (!window.confirm(confirmMsg)) return;
    setPending(u.id);
    try {
      await apiFetch(`/api/admin/users/${u.id}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ isBlocked: !u.isBlocked }),
      });
      reload();
    } catch {
      /* no-op */
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        actions={
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search')}
            className="h-9 w-48"
          />
        }
      />

      {loading ? (
        <LoadingState label={t('common.loading')} />
      ) : error ? (
        <ErrorState label={t('common.error')} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState label={t('users.empty')} />
      ) : (
        <Table>
          <THead>
            <TH>{t('users.colEmail')}</TH>
            <TH>{t('users.colName')}</TH>
            <TH>{t('users.colLocale')}</TH>
            <TH>{t('users.colStatus')}</TH>
            <TH>{t('users.colJoined')}</TH>
            <TH />
          </THead>
          <TBody>
            {filtered.map((u) => (
              <TR key={u.id}>
                <TD className="font-mono text-xs">{u.email}</TD>
                <TD>{u.displayName ?? '—'}</TD>
                <TD className="uppercase">{u.locale}</TD>
                <TD>
                  {u.isBlocked ? (
                    <Badge tone="danger">{t('users.blocked')}</Badge>
                  ) : (
                    <Badge tone="success">{t('users.active')}</Badge>
                  )}
                </TD>
                <TD className="whitespace-nowrap text-xs text-muted">
                  {formatDate(u.createdAt, locale)}
                </TD>
                <TD>
                  <Button
                    size="sm"
                    variant={u.isBlocked ? 'secondary' : 'danger'}
                    disabled={pending === u.id}
                    onClick={() => toggleBlock(u)}
                  >
                    {u.isBlocked ? t('users.unblock') : t('users.block')}
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
