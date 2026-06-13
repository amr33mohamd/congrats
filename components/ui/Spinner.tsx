import * as React from 'react';
import { cn } from './cn';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

export function Spinner({ size = 20, className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={cn('inline-block animate-spin rounded-full border-2 border-border border-t-brand', className)}
      style={{ width: size, height: size }}
      {...props}
    />
  );
}
