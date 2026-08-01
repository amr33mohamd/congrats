import type { ReactNode } from 'react';
import { getLocale } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';

type LegalLayoutProps = {
  title: string;
  updated: string;
  children: ReactNode;
};

/**
 * Reusable chrome for legal / trust pages: marketing header, a centered,
 * readable prose column with styled headings/paragraphs/lists, a
 * "Last updated" line, and the marketing footer. RTL is inherited from the
 * <html dir> set in the locale layout.
 */
export async function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const session = await getSession();

  return (
    <div className="min-h-[100dvh] bg-surface-2">
      <SiteHeader isAuthed={Boolean(session)} />
      <main>
        <article className="mx-auto max-w-3xl px-token-4 py-token-8 md:py-token-12">
          <h1 className="font-heading text-3xl font-bold text-ink md:text-4xl">{title}</h1>
          <p className="mt-token-2 text-sm text-muted">
            {isAr ? `آخر تحديث: ${updated}` : `Last updated: ${updated}`}
          </p>
          <p className="mt-token-4 rounded-lg border border-border bg-surface px-token-4 py-token-3 text-sm italic text-muted">
            {isAr
              ? 'هذا نموذج مبدئي — يُرجى مراجعته مع مختص قانوني قبل الإطلاق.'
              : 'This is a starting template — review with a legal professional before launch.'}
          </p>

          <div
            className={[
              'mt-token-8 space-y-token-6 text-base leading-relaxed text-muted',
              '[&_h2]:mt-token-8 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink md:[&_h2]:text-2xl',
              '[&_h3]:mt-token-6 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink',
              '[&_p]:mt-token-3',
              '[&_a]:font-medium [&_a]:text-brand [&_a]:underline hover:[&_a]:text-brand-strong',
              '[&_strong]:font-semibold [&_strong]:text-ink',
              '[&_ul]:mt-token-3 [&_ul]:list-disc [&_ul]:space-y-token-2 [&_ul]:ps-token-6',
              '[&_ol]:mt-token-3 [&_ol]:list-decimal [&_ol]:space-y-token-2 [&_ol]:ps-token-6',
            ].join(' ')}
          >
            {children}
          </div>

          <p className="mt-token-12 text-sm text-muted">
            {isAr ? 'لأي استفسار بخصوص هذه الصفحة، تواصل معنا على' : 'Questions about this page? Contact us at'}{' '}
            <a href="mailto:[support email]" className="font-medium text-brand underline hover:text-brand-strong">
              [support email]
            </a>
            .
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
