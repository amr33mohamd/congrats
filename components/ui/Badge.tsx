import * as React from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'brand' | 'success' | 'danger' | 'warning';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted border-border',
  brand: 'bg-brand/10 text-brand-strong border-brand/20',
  success: 'bg-success/10 text-success border-success/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border px-token-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
