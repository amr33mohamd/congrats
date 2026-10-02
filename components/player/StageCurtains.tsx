'use client';

/**
 * Velvet stage curtains for the "theatre" art direction. Closed, they are the
 * backdrop behind the open gate; once the guest taps open they sweep apart and
 * gather to the sides, the way a theatre curtain rises on the first scene.
 * Pure CSS velvet (folds are a repeating gradient), so there is no image to
 * load before the reveal can start.
 */
import * as React from 'react';
import { motion } from 'framer-motion';
import { VELVET } from './SceneOrnament';

const folds = (dark: string, light: string) =>
  `repeating-linear-gradient(90deg, ${dark} 0px, ${light} 22px, ${dark} 46px), linear-gradient(${VELVET.base}, ${VELVET.base})`;

function Panel({ side, gold }: { side: 'left' | 'right'; gold: string }) {
  return (
    <div
      className="absolute inset-y-0 w-1/2"
      style={{
        [side]: 0,
        backgroundImage: folds('rgba(30,2,8,0.55)', 'rgba(140,40,55,0.18)'),
        backgroundBlendMode: 'multiply',
        boxShadow: side === 'left' ? 'inset -18px 0 30px rgba(0,0,0,0.45)' : 'inset 18px 0 30px rgba(0,0,0,0.45)',
      }}
    >
      {/* gold fringe along the hem */}
      <div
        className="absolute inset-x-0 bottom-0 h-5"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${gold} 0 2px, transparent 2px 6px)`,
          borderTop: `3px solid ${gold}`,
        }}
      />
    </div>
  );
}

/** A tasselled valance across the top, shared by the closed and opening states. */
function Valance({ gold }: { gold: string }) {
  return (
    <div className="absolute inset-x-0 top-0 h-16" style={{ background: VELVET.deep, borderBottom: `3px solid ${gold}` }}>
      <div
        className="absolute inset-x-0 -bottom-3 h-3"
        style={{ backgroundImage: `radial-gradient(circle at 50% 0, ${gold} 3px, transparent 4px)`, backgroundSize: '26px 12px' }}
      />
    </div>
  );
}

export function ClosedCurtains({ gold }: { gold: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Panel side="left" gold={gold} />
      <Panel side="right" gold={gold} />
      <Valance gold={gold} />
    </div>
  );
}

export function CurtainReveal({
  gold,
  embedded,
  onDone,
}: {
  gold: string;
  embedded: boolean;
  onDone: () => void;
}) {
  const ease = [0.65, 0, 0.35, 1] as const;
  return (
    <div aria-hidden className={`pointer-events-none ${embedded ? 'absolute' : 'fixed'} inset-0 z-40 overflow-hidden`}>
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 origin-left"
        initial={{ x: 0, scaleX: 1 }}
        animate={{ x: '-62%', scaleX: 0.55 }}
        transition={{ duration: 1.8, ease }}
      >
        <Panel side="left" gold={gold} />
      </motion.div>
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 origin-right"
        initial={{ x: 0, scaleX: 1 }}
        animate={{ x: '62%', scaleX: 0.55 }}
        transition={{ duration: 1.8, ease }}
        onAnimationComplete={onDone}
      >
        <Panel side="right" gold={gold} />
      </motion.div>
      <motion.div initial={{ y: 0 }} animate={{ y: '-110%' }} transition={{ duration: 1.2, delay: 1.1, ease }}>
        <Valance gold={gold} />
      </motion.div>
    </div>
  );
}
