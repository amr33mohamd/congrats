'use client';

/**
 * Users list with block/unblock and comped-access grant/revoke. Consumes
 * GET /api/admin/users, PATCH /api/admin/users/:id/block and
 * PATCH /api/admin/users/:id/all-access. Searchable by email/name.
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
  const [actionError, setActionError] = React.useState(false);

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
    await mutate(u, `/api/admin/users/${u.id}/block`, { isBlocked: !u.isBlocked });
  };

  const toggleAllAccess = async (u: UserRow) => {
    const confirmMsg = u.allAccess ? t('users.revokeConfirm') : t('users.grantConfirm');
    if (!window.confirm(confirmMsg)) return;
    await mutate(u, `/api/admin/users/${u.id}/all-access`, { allAccess: !u.allAccess });
  };

  const mutate = async (u: UserRow, url: string, body: Record<string, unknown>) => {
    setPending(u.id);
    setActionError(false);
    try {
      await apiFetch(url, { method: 'PATCH', body: JSON.stringify(body) });
      reload();
    } catch {
      // Surface it: a silently failed grant/revoke looks like it worked.
      setActionError(true);
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

      {actionError ? (
        <div
          role="alert"
          className="mb-token-4 rounded-md border border-danger/30 bg-danger/10 px-token-4 py-token-3 text-sm text-danger"
        >
          {t('users.actionError')}
        </div>
      ) : null}

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
            <TH>{t('users.colAccess')}</TH>
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
                <TD>
                  {u.allAccess ? (
                    <Badge tone="brand">{t('users.comped')}</Badge>
                  ) : (
                    <span className="text-xs text-muted">{t('users.standard')}</span>
                  )}
                </TD>
                <TD className="whitespace-nowrap text-xs text-muted">
                  {formatDate(u.createdAt, locale)}
                </TD>
                <TD>
                  <div className="flex flex-wrap justify-end gap-token-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pending === u.id}
                      onClick={() => toggleAllAccess(u)}
                    >
                      {u.allAccess ? t('users.revokeAccess') : t('users.grantAccess')}
                    </Button>
                    <Button
                      size="sm"
                      variant={u.isBlocked ? 'secondary' : 'danger'}
                      disabled={pending === u.id}
                      onClick={() => toggleBlock(u)}
                    >
                      {u.isBlocked ? t('users.unblock') : t('users.block')}
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
