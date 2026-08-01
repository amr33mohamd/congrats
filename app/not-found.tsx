/**
 * Global not-found boundary. Rendered for unmatched top-level paths OUTSIDE the
 * [locale] segment, so it must NOT depend on the next-intl provider (which only
 * wraps [locale] routes). Plain, locale-neutral 404 → also silences the
 * build-time "No messages were configured on the provider" warning that Next's
 * default not-found page triggered when rendered under the bare root layout.
 */
import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#0b0b0f',
          color: '#f5f5f7',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>404</h1>
        <p style={{ opacity: 0.7 }}>
          الصفحة غير موجودة · Page not found
        </p>
        <Link href="/ar" style={{ color: '#a78bfa', textDecoration: 'underline' }}>
          Congrats →
        </Link>
      </body>
    </html>
  );
}
