import { setRequestLocale, getTranslations } from 'next-intl/server';

// PLACEHOLDER owned by F0 — D1 builds the builder wizard + my-experiences here.
export default async function DashboardHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('common');

  return (
    <main className="mx-auto max-w-3xl p-token-8">
      <h1 className="font-heading text-2xl font-bold text-ink">{t('nav.dashboard')}</h1>
      <p className="mt-token-2 text-sm text-muted">[dashboard — D1 · consumes /api/dashboard/*]</p>
    </main>
  );
}
