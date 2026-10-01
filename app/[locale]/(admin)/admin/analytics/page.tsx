import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getDb } from '@/db';
import { getAnalytics } from '@/server/admin/analytics-service';
import { PageHeader, Table, THead, TH, TBody, TR, TD, EmptyState } from '@/components/admin/primitives';
import { formatPiastres } from '@/components/admin/lib';

export const dynamic = 'force-dynamic';

const RANGES = [1, 7, 30, 90] as const;

/** Admin → Analytics. The admin layout already restricts this to admins. */
export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.analytics');
  const requested = Number((await searchParams).days);
  const days = (RANGES as readonly number[]).includes(requested) ? requested : 7;
  const a = await getAnalytics(await getDb(), days);
  const nf = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US');
  const top = Math.max(1, a.funnel[0]?.visitors ?? 0);
  const peak = Math.max(1, ...a.daily.map((d) => d.visitors));
  const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : '—');

  return (
    <div className="flex flex-col gap-token-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={RANGES.map((r) => (
          <Link
            key={r}
            href={`/admin/analytics?days=${r}`}
            className={`rounded-md px-token-3 py-token-1 text-sm font-medium ${
              r === days ? 'bg-brand text-white' : 'border border-border text-ink hover:bg-surface'
            }`}
          >
            {t('range', { days: r })}
          </Link>
        ))}
      />

      <section className="rounded-lg border border-border bg-surface p-token-5">
        <h2 className="mb-token-4 font-heading text-lg font-bold text-ink">{t('funnel')}</h2>
        <ol className="flex flex-col gap-token-3">
          {a.funnel.map((step, i) => (
            <li key={step.name}>
              <div className="mb-token-1 flex justify-between text-sm">
                <span className="font-medium text-ink">{t(`events.${step.name}`)}</span>
                <span className="text-muted">
                  {nf.format(step.visitors)}
                  {i > 0 ? ` · ${pct(step.visitors, a.funnel[i - 1]!.visitors)}` : ''}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(step.visitors / top) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-token-3 text-xs text-muted">{t('funnelHint')}</p>
      </section>

      <section>
        <h2 className="mb-token-3 font-heading text-lg font-bold text-ink">{t('sources')}</h2>
        {a.sources.length === 0 ? (
          <EmptyState label={t('empty')} />
        ) : (
          <Table>
            <THead>
              <TH>{t('colSource')}</TH>
              <TH>{t('colCampaign')}</TH>
              <TH>{t('colVisitors')}</TH>
              <TH>{t('colSignups')}</TH>
              <TH>{t('colCreated')}</TH>
              <TH>{t('colPublished')}</TH>
              <TH>{t('colPaid')}</TH>
              <TH>{t('colRevenue')}</TH>
            </THead>
            <TBody>
              {a.sources.map((s) => (
                <TR key={`${s.source}|${s.campaign}`}>
                  <TD className="font-medium">{s.source === 'direct' ? t('direct') : s.source}</TD>
                  <TD className="text-muted">{s.campaign || '—'}</TD>
                  <TD>{nf.format(s.visitors)}</TD>
                  <TD>{nf.format(s.signups)}</TD>
                  <TD>{nf.format(s.created)}</TD>
                  <TD>{nf.format(s.published)}</TD>
                  <TD>{nf.format(s.paid)}</TD>
                  <TD>{s.revenuePiastres ? formatPiastres(s.revenuePiastres, locale) : '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      <div className="grid gap-token-6 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-token-5">
          <h2 className="mb-token-4 font-heading text-lg font-bold text-ink">{t('daily')}</h2>
          {a.daily.length === 0 ? (
            <p className="text-sm text-muted">{t('empty')}</p>
          ) : (
            <ul className="flex flex-col gap-token-2 text-sm">
              {a.daily.map((d) => (
                <li key={d.day} className="grid grid-cols-[6rem_1fr_auto] items-center gap-token-3">
                  <span className="text-muted">{d.day}</span>
                  <span className="h-2 rounded-full bg-brand/80" style={{ width: `${(d.visitors / peak) * 100}%` }} />
                  <span className="text-ink">
                    {nf.format(d.visitors)} · {nf.format(d.created)} · {nf.format(d.paid)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-token-3 text-xs text-muted">{t('dailyHint')}</p>
        </section>

        <section className="rounded-lg border border-border bg-surface p-token-5">
          <h2 className="mb-token-4 font-heading text-lg font-bold text-ink">{t('cards')}</h2>
          <dl className="grid grid-cols-2 gap-token-4">
            {a.engagement.map((e) => (
              <div key={e.name}>
                <dt className="text-xs text-muted">{t(`events.${e.name}`)}</dt>
                <dd className="font-heading text-2xl font-bold text-ink">{nf.format(e.count)}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mb-token-2 mt-token-6 text-sm font-bold text-ink">{t('devices')}</h3>
          <p className="text-sm text-muted">
            {a.devices.map((d) => `${t(`device.${d.device === 'mobile' || d.device === 'desktop' ? d.device : 'unknown'}`)} ${nf.format(d.visitors)}`).join(' · ') || '—'}
          </p>
        </section>
      </div>

      <section>
        <h2 className="mb-token-3 font-heading text-lg font-bold text-ink">{t('pages')}</h2>
        {a.pages.length === 0 ? (
          <EmptyState label={t('empty')} />
        ) : (
          <Table>
            <THead>
              <TH>{t('colPage')}</TH>
              <TH>{t('colViews')}</TH>
            </THead>
            <TBody>
              {a.pages.map((p) => (
                <TR key={p.path}>
                  <TD className="font-mono text-xs" >
                    <span dir="ltr">{p.path}</span>
                  </TD>
                  <TD>{nf.format(p.views)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>
    </div>
  );
}
