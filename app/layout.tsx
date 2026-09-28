import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_URL } from '@/lib/site';

// Root-level metadataBase so file-convention routes outside [locale] (the root
// opengraph-image) resolve absolute URLs against the real origin.
export function generateMetadata(): Metadata {
  return { metadataBase: new URL(SITE_URL) };
}

// Privacy-friendly analytics (no cookies, no personal data). Only rendered when
// a domain is configured at build time; the CSP in next.config.mjs allows the
// same host only in that case.
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_HOST = (process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || 'https://plausible.io').replace(/\/$/, '');

// Root layout is a thin pass-through; the real <html>/<body> with dir + fonts
// lives in app/[locale]/layout.tsx so it is locale-aware. next/script renders
// nothing in place and injects the tag client-side, so it is safe beside it.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {PLAUSIBLE_DOMAIN ? (
        <Script
          defer
          strategy="afterInteractive"
          data-domain={PLAUSIBLE_DOMAIN}
          src={`${PLAUSIBLE_HOST}/js/script.js`}
        />
      ) : null}
    </>
  );
}
