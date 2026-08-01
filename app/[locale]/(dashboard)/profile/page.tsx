import { setRequestLocale } from 'next-intl/server';
import { ProfileForm } from '@/components/dashboard/ProfileForm';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProfileForm />;
}
