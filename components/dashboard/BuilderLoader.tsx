'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Spinner, Button } from '@/components/ui';
import { dashboardApi, ApiError } from './api-client';
import type { EditorExperience } from './types';
import { BuilderWizard } from './BuilderWizard';

type WizardStep = 'details' | 'content' | 'review';

/** Client loader: fetches the editor payload then mounts the wizard. */
export function BuilderLoader({
  experienceId,
  initialStep,
}: {
  experienceId: string;
  initialStep?: WizardStep;
}) {
  const t = useTranslations('dashboard');
  const [exp, setExp] = React.useState<EditorExperience | null>(null);
  const [error, setError] = React.useState<'notfound' | 'load' | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await dashboardApi.getExperience(experienceId);
        if (active) setExp(data);
      } catch (e) {
        if (!active) return;
        setError(e instanceof ApiError && e.status === 404 ? 'notfound' : 'load');
      }
    })();
    return () => {
      active = false;
    };
  }, [experienceId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-token-8 text-center">
        <span aria-hidden className="text-4xl">😕</span>
        <p className="mt-token-4 text-muted">
          {error === 'notfound' ? t('errors.notFound') : t('errors.loadFailed')}
        </p>
        <Link href="/dashboard" className="mt-token-6">
          <Button variant="secondary">{t('nav.experiences')}</Button>
        </Link>
      </div>
    );
  }

  if (!exp) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={28} />
      </div>
    );
  }

  return <BuilderWizard experience={exp} initialStep={initialStep} />;
}
