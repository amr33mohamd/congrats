import { setRequestLocale } from 'next-intl/server';
import { QueueClient } from '@/components/admin/QueueClient';

export default async function QueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <QueueClient />;
}
