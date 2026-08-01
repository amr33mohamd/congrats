'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary for errors in the root layout itself. Must render its own
 * <html>/<body>. Intentionally minimal and self-contained.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[global error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          background: '#FAF8F7',
          color: '#141010',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div style={{ fontSize: 48 }} aria-hidden>
          🎈
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: '#8C817B', maxWidth: 360, margin: 0 }}>
          An unexpected error occurred. Please try again.
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
          Try again
        </button>
      </body>
    </html>
  );
}
