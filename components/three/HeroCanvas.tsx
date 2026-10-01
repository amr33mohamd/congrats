'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

/**
 * Client boundary for the WebGL hero.
 *
 * `ssr: false` is only legal inside a client component in the App Router, and
 * Three reaches for `window` at import time, so the scene has to come in here
 * rather than in the (server) Hero.
 *
 * The WebGL scene is strictly an enhancement. The static poster below is what
 * renders on the server, while the scene loads, on devices without WebGL, for
 * visitors who asked for reduced motion (they never download three.js at all),
 * and if the scene throws at runtime (a texture 404, a lost context) — so the
 * hero is never a blank hole and never takes the page down with it.
 */
const HeroScene = dynamic(() => import('./HeroScene'), {
  ssr: false,
  loading: () => null,
});

/** Portrait crops of the real template photography, used as the floating deck. */
const PHOTOS = [
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=620&h=1080&q=70',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=620&h=1080&q=70',
  'https://images.unsplash.com/photo-1561089489-f13d5e730d72?auto=format&fit=crop&w=620&h=1080&q=70',
];

/**
 * A still of the same deck: three tilted photo cards, laid out with CSS only.
 * `shift` mirrors the WebGL scene's offset so the deck sits away from the copy
 * column in both directions; on phones the copy is centred and the deck simply
 * sits behind it under the hero's scrim.
 */
function Poster({ shift }: { shift: number }) {
  const side = shift < 0 ? 'md:justify-start md:ps-[8%]' : shift > 0 ? 'md:justify-end md:pe-[8%]' : '';
  // In RTL `justify-start` is the right edge; the deck must land on the side
  // opposite the copy, which the Hero expresses as a physical sign — so this
  // container is forced LTR to keep that sign meaning left/right.
  const card =
    'relative aspect-[9/16] overflow-hidden rounded-[1.4rem] ring-1 ring-[#D6A435]/25 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]';
  return (
    <div dir="ltr" className={`absolute inset-0 flex items-center justify-center ${side}`} aria-hidden>
      <div className="relative flex items-center">
        <div className={`${card} -me-10 w-[26vw] max-w-[150px] -rotate-[10deg] opacity-80 md:max-w-[170px]`}>
          <Image src={PHOTOS[1]!} alt="" fill sizes="170px" className="object-cover" />
        </div>
        <div className={`${card} z-10 w-[34vw] max-w-[200px] -rotate-2 md:max-w-[230px]`}>
          <Image src={PHOTOS[0]!} alt="" fill sizes="230px" className="object-cover" priority />
        </div>
        <div className={`${card} -ms-10 w-[26vw] max-w-[150px] rotate-[9deg] opacity-80 md:max-w-[170px]`}>
          <Image src={PHOTOS[2]!} alt="" fill sizes="170px" className="object-cover" />
        </div>
      </div>
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

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Swallows a crash inside the WebGL scene and falls back to the poster. */
class SceneBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    // Decorative only — log for diagnosis, never escalate to the route boundary.
    console.warn('[hero] WebGL scene failed, showing poster', err);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function HeroCanvas({ shift = 0 }: { shift?: number }) {
  // null = not decided yet (server render / first paint) → poster.
  const [use3d, setUse3d] = React.useState<boolean | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setUse3d(hasWebGL() && !prefersReducedMotion());
  }, []);

  React.useEffect(() => {
    if (!use3d) return;
    // Keep the poster up for a beat so the canvas (transparent until its
    // textures arrive) fades in over it instead of flashing an empty frame.
    const id = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(id);
  }, [use3d]);

  const poster = <Poster shift={shift} />;

  return (
    // isolate: the poster's front card uses z-10 to sit over its neighbours;
    // without its own stacking context that z-index escaped and painted the
    // card over the hero copy and buttons on phones.
    <div className="absolute inset-0 isolate">
      {!use3d || !ready ? poster : null}
      {use3d ? (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
        >
          <SceneBoundary fallback={poster}>
            <HeroScene photos={PHOTOS} shift={shift} />
          </SceneBoundary>
        </div>
      ) : null}
    </div>
  );
}
