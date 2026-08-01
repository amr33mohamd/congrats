import { setRequestLocale } from 'next-intl/server';
import { TemplatesClient } from '@/components/admin/TemplatesClient';

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TemplatesClient />;
}
