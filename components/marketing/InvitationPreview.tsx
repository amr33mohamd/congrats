'use client';

import * as React from 'react';
import type { BoundExperience } from '@/lib/template-contract';
import { TemplateStage } from '@/components/templates/TemplateStage';

/**
 * A real invitation template, walking through its sections on the home page.
 *
 * It only cycles while on screen and never for reduced-motion visitors (they
 * get the settled cover), so a section most people scroll past costs nothing.
 */
export function InvitationPreview({ experience, label }: { experience: BoundExperience; label: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [reduced, setReduced] = React.useState(true);
  const [index, setIndex] = React.useState(0);
  const count = experience.steps.length;

  React.useEffect(() => {
    try {
      setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch {
      setReduced(false);
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = visible && !reduced && count > 1;

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 2600);
    return () => clearInterval(id);
  }, [playing, count]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-[1.75rem] bg-black ring-1 ring-white/15 shadow-[var(--shadow-pop)]"
    >
      <TemplateStage experience={experience} sceneIndex={index} animate={playing} />
    </div>
  );
}
