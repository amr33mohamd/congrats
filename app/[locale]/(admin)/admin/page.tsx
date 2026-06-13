import { setRequestLocale, getTranslations } from 'next-intl/server';

// PLACEHOLDER owned by F0 — D2 builds the approval queue + admin CRUD here.
export default async function AdminHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('common');

  return (
    <main className="mx-auto max-w-4xl p-token-8">
      <h1 className="font-heading text-2xl font-bold text-ink">{t('nav.admin')}</h1>
      <p className="mt-token-2 text-sm text-muted">[admin panel — D2 · consumes /api/admin/*]</p>
    </main>
  );
}
