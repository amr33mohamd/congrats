import { setRequestLocale } from 'next-intl/server';
import { AuditClient } from '@/components/admin/AuditClient';

export default async function AuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuditClient />;
}
