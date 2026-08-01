'use client';

import { useEffect } from 'react';

/**
 * Route-level error boundary for the app. Kept dependency-light (no intl
 * provider needed) so it renders even when a deeper provider is what failed.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surfaces to the server log / error tracker (see instrumentation).
    console.error('[app error]', error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-surface-2 p-6 text-center">
      <div className="text-5xl" aria-hidden>
        🎈
      </div>
      <h1 className="font-heading text-2xl font-bold text-ink">Something went wrong</h1>
      <p className="max-w-sm text-muted">
        An unexpected error occurred. Please try again — if it keeps happening, come back in a moment.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={reset}
          className="rounded-pill bg-brand px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-strong"
        >
          Try again
        </button>
        {/* Hard navigation is intentional here: the router may be the thing that failed. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="rounded-pill border border-border bg-surface px-6 py-2.5 font-medium text-ink transition-colors hover:bg-surface-2"
        >
          Go home
        </a>
      </div>
    </main>
  );
}
