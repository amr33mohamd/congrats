'use client';

/**
 * Audit log viewer. Consumes GET /api/admin/audit. Read-only, newest-first.
 */
import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui';
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
import { useApi, asList, formatDate } from './lib';
import type { AuditRow } from './types';

function actorLabel(type: string | null | undefined, t: (k: string) => string): string {
  if (type === 'admin') return t('audit.actorAdmin');
  if (type === 'user') return t('audit.actorUser');
  if (type === 'system') return t('audit.actorSystem');
  return type ?? '—';
}

function actorTone(type: string | null | undefined): 'brand' | 'neutral' | 'warning' {
  if (type === 'admin') return 'brand';
  if (type === 'system') return 'warning';
  return 'neutral';
}

function details(metadata: unknown): string {
  if (metadata == null) return '—';
  if (typeof metadata === 'string') return metadata;
  try {
    return JSON.stringify(metadata);
  } catch {
    return '—';
  }
}

export function AuditClient() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const { data, loading, error, reload } = useApi<unknown>('/api/admin/audit');

  const rows = React.useMemo(() => {
    const list = asList<AuditRow>(data, 'audit');
    return [...list].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [data]);

  return (
    <div>
      <PageHeader title={t('audit.title')} subtitle={t('audit.subtitle')} />

      {loading ? (
        <LoadingState label={t('common.loading')} />
      ) : error ? (
        <ErrorState label={t('common.error')} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState label={t('audit.empty')} />
      ) : (
        <Table>
          <THead>
            <TH>{t('audit.colTime')}</TH>
            <TH>{t('audit.colActor')}</TH>
            <TH>{t('audit.colAction')}</TH>
            <TH>{t('audit.colEntity')}</TH>
            <TH>{t('audit.colDetails')}</TH>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD className="whitespace-nowrap text-xs text-muted">
                  {formatDate(r.createdAt, locale)}
                </TD>
                <TD>
                  <Badge tone={actorTone(r.actorType)}>{actorLabel(r.actorType, t)}</Badge>
                </TD>
                <TD className="font-mono text-xs font-medium">{r.action}</TD>
                <TD className="text-xs text-muted">
                  {r.entityType ? (
                    <span>
                      {r.entityType}
                      {r.entityId ? (
                        <span className="opacity-60"> · {r.entityId.slice(0, 8)}</span>
                      ) : null}
                    </span>
                  ) : (
                    '—'
                  )}
                </TD>
                <TD className="max-w-[20rem] truncate font-mono text-xs text-muted">
                  {details(r.metadata)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
