'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

/**
 * Route-level error boundary for the app. Kept dependency-light (no intl
 * provider needed) so it renders even when a deeper provider is what failed —
 * the copy is inline and the locale comes straight from the URL.
 */

const copy = {
  ar: {
    title: 'حصلت مشكلة',
    body: 'حصل خطأ غير متوقع. جرّب تاني — ولو المشكلة فضلت، ارجع بعد شوية.',
    retry: 'حاول مرة أخرى',
    home: 'الرئيسية',
    ref: 'رقم المرجع',
  },
  en: {
    title: 'Something went wrong',
    body: 'An unexpected error occurred. Please try again — if it keeps happening, come back in a moment.',
    retry: 'Try again',
    home: 'Go home',
    ref: 'Reference',
  },
} as const;

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === 'en' ? 'en' : 'ar';
  const c = copy[locale];

  useEffect(() => {
    // Surfaces to the server log / error tracker (see instrumentation).
    console.error('[app error]', error);
    // Errors caught by this boundary never reach the global handlers, so
    // report them explicitly — only when Sentry is configured at build time.
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void import('@sentry/nextjs').then((Sentry) => Sentry.captureException(error));
    }
  }, [error]);

  return (
    <main
      className="relative isolate flex min-h-[100dvh] flex-col items-center justify-center gap-4 overflow-hidden bg-surface-2 px-4 py-10 text-center"
      style={{
        backgroundImage:
          'radial-gradient(60% 45% at 50% 0%, rgb(var(--c-brand-500) / 0.22), transparent 70%)',
      }}
    >
      <div
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-3xl ring-1 ring-border"
      >
        🎈
      </div>
      <h1 className="font-heading text-2xl font-bold text-ink">{c.title}</h1>
      <p className="max-w-sm text-muted">{c.body}</p>
      {error.digest ? (
        <p className="text-xs text-muted/70">
          {c.ref}: <span dir="ltr" className="font-mono">{error.digest}</span>
        </p>
      ) : null}
      <div className="mt-2 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="rounded-pill bg-brand px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {c.retry}
        </button>
        {/* Hard navigation is intentional here: the router may be the thing that failed. */}
        <a
          href={`/${locale}`}
          className="rounded-pill border border-border bg-surface px-6 py-2.5 font-medium text-ink transition-colors hover:bg-white/10"
        >
          {c.home}
        </a>
      </div>
    </main>
  );
}
