import './globals.css';
import type { ReactNode } from 'react';

// Root layout is a thin pass-through; the real <html>/<body> with dir + fonts
// lives in app/[locale]/layout.tsx so it is locale-aware.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
