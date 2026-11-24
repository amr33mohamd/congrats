import { setRequestLocale } from 'next-intl/server';
import { RsvpPage } from '@/components/dashboard/RsvpPage';

export default async function ExperienceRsvpsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <RsvpPage experienceId={id} />;
}
