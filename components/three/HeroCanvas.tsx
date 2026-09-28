'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

/**
 * Client boundary for the WebGL hero.
 *
 * `ssr: false` is only legal inside a client component in the App Router, and
 * Three reaches for `window` at import time, so the scene has to come in here
 * rather than in the (server) Hero. While it loads — and on any device without
 * WebGL — the poster below stands in, so the hero is never a blank hole.
 */
const HeroScene = dynamic(() => import('./HeroScene'), {
  ssr: false,
  loading: () => <Poster />,
});

/** Portrait crops of the real template photography, used as the floating deck. */
const PHOTOS = [
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=620&h=1080&q=70',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=620&h=1080&q=70',
  'https://images.unsplash.com/photo-1561089489-f13d5e730d72?auto=format&fit=crop&w=620&h=1080&q=70',
];

function Poster() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
      <div className="h-[62%] w-[34%] max-w-[230px] rotate-[-3deg] rounded-[1.6rem] bg-gradient-to-br from-brand to-brand-strong opacity-70 blur-[1px] shadow-[var(--shadow-pop)]" />
    </div>
  );
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function HeroCanvas({ shift = 0 }: { shift?: number }) {
  const [supported, setSupported] = React.useState<boolean | null>(null);
  React.useEffect(() => setSupported(hasWebGL()), []);

  return (
    <div className="absolute inset-0">
      {supported ? <HeroScene photos={PHOTOS} shift={shift} /> : <Poster />}
    </div>
  );
}
