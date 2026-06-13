import { setRequestLocale, getTranslations } from 'next-intl/server';

// PLACEHOLDER owned by F0 — D1 builds the real marketing landing in (marketing)/**.
export default async function MarketingHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('common');

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col items-center justify-center gap-token-4 p-token-8 text-center">
      <h1 className="font-heading text-4xl font-bold text-ink">{t('app.name')}</h1>
      <p className="text-lg text-muted">{t('app.tagline')}</p>
      <p className="text-sm text-muted">[marketing landing — D1]</p>
    </main>
  );
}
