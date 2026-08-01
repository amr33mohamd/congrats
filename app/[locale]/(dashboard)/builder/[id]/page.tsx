import { setRequestLocale } from 'next-intl/server';
import { BuilderLoader } from '@/components/dashboard/BuilderLoader';

type WizardStep = 'details' | 'content' | 'review';

export default async function BuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { locale, id } = await params;
  const { step } = await searchParams;
  setRequestLocale(locale);

  const initialStep: WizardStep =
    step === 'content' || step === 'review' ? (step as WizardStep) : 'details';

  return <BuilderLoader experienceId={id} initialStep={initialStep} />;
}
