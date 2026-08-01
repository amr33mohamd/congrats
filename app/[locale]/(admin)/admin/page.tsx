import { setRequestLocale } from 'next-intl/server';
import { OverviewClient } from '@/components/admin/OverviewClient';

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <OverviewClient />;
}
