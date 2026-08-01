import * as React from 'react';
import { cn } from '@/components/ui/cn';

/**
 * A decorative phone mock that frames the Player at a phone aspect ratio.
 * Direction-agnostic (centered). The child is clipped to the screen radius.
 */
export function PhoneFrame({
  children,
  className,
  glow = true,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={cn('relative mx-auto w-full max-w-[300px]', className)}>
      {glow ? (
        <div
          aria-hidden
          className="absolute -inset-6 -z-10 rounded-[3rem] bg-brand/30 blur-3xl"
        />
      ) : null}
      <div className="rounded-[2.5rem] border border-white/15 bg-neutral-900 p-2.5 shadow-[var(--shadow-pop)]">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-black">
          {/* notch */}
          <div className="absolute inset-inline-0 top-0 z-30 mx-auto mt-2 h-5 w-24 rounded-pill bg-black/80" />
          {children}
        </div>
      </div>
    </div>
  );
}
