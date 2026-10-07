'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary for errors in the root layout itself. Must render its own
 * <html>/<body>. Intentionally minimal and self-contained.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[global error]', error);
    // Report only when Sentry is configured (DSN inlined at build time); the
    // lazy import keeps the SDK out of the bundle path otherwise.
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void import('@sentry/nextjs').then((Sentry) => Sentry.captureException(error));
    }
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Tahoma, Roboto, sans-serif',
          background: '#FAF8F7',
          color: '#141010',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div style={{ fontSize: 48 }} aria-hidden>
          🎈
        </div>
        {/* Arabic first (the site's main language), English underneath. */}
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>حصلت مشكلة</h1>
        <p style={{ color: '#8C817B', maxWidth: 360, margin: 0 }}>حصل خطأ مش متوقع. جرّب تاني كمان شوية.</p>
        <p lang="en" dir="ltr" style={{ color: '#8C817B', maxWidth: 360, margin: 0, fontSize: 14 }}>
          Something went wrong. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 8,
            border: 'none',
            borderRadius: 9999,
            background: '#F0436E',
            color: '#fff',
            fontWeight: 500,
            padding: '10px 24px',
            cursor: 'pointer',
          }}
        >
          جرّب تاني · Try again
        </button>
      </body>
    </html>
  );
}
