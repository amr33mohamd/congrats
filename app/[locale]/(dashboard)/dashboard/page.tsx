import { setRequestLocale } from 'next-intl/server';
import { ExperienceList } from '@/components/dashboard/ExperienceList';

export default async function DashboardHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ExperienceList />;
}
