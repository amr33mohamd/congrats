import { setRequestLocale } from 'next-intl/server';
import { ImportClient } from '@/components/admin/ImportClient';

export default async function ImportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ImportClient />;
}
