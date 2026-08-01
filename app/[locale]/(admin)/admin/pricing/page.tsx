import { setRequestLocale } from 'next-intl/server';
import { PricingClient } from '@/components/admin/PricingClient';

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PricingClient />;
}
