import * as React from 'react';
import { cn } from './cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-md border border-border bg-surface px-3 text-ink',
        'placeholder:text-muted',
        'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
