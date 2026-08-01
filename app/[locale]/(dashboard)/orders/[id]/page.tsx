import { setRequestLocale } from 'next-intl/server';
import { OrderStatus } from '@/components/dashboard/OrderStatus';

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <OrderStatus orderId={id} />;
}
