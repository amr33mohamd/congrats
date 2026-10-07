'use client';

import * as React from 'react';

/**
 * An in-page anchor (`#quiz`) that glides to its target. Without JS it is a
 * plain jump link; with reduced motion it jumps instead of scrolling.
 */
export function ScrollToLink({
  target,
  className,
  children,
}: {
  target: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`#${target}`}
      className={className}
      onClick={(e) => {
        const el = document.getElementById(target);
        if (!el) return;
        e.preventDefault();
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
        window.history.replaceState(null, '', `#${target}`);
      }}
    >
      {children}
    </a>
  );
}
