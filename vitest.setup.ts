// Tests get a throwaway in-memory database. Without this they used the dev
// database (.data/pglite) and left their fixtures in the developer's data.
process.env.PGLITE_PATH = 'memory://';

import '@testing-library/jest-dom/vitest';

// jsdom does not implement matchMedia; the Player reads it for reduced-motion.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// jsdom has no IntersectionObserver; the Player reveals each scene section with
// framer-motion's useInView. Report everything as intersecting so scroll-driven
// content is present in tests.
if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  class StubIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(private cb: IntersectionObserverCallback) {}
    observe(target: Element): void {
      this.cb(
        [{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry],
        this,
      );
    }
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  // The `in` guard above narrows `window` to `never` for TS, so assign through
  // globalThis and let the window reference come along with it.
  (globalThis as unknown as Record<string, unknown>).IntersectionObserver =
    StubIntersectionObserver;
}

// jsdom implements no media playback; the Player starts the soundtrack on open.
if (typeof window !== 'undefined') {
  window.HTMLMediaElement.prototype.play = function play() {
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function pause() {};
}
