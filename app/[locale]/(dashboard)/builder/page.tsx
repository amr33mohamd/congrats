import { setRequestLocale } from 'next-intl/server';
import { TemplatePicker } from '@/components/dashboard/TemplatePicker';

export default async function NewExperiencePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TemplatePicker />;
}
