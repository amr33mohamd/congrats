'use client';

import * as React from 'react';
import { cn } from './cn';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Minimal, dependency-free modal dialog. Closes on backdrop click + Escape.
 * Designers extend; consumers control `open`.
 */
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-token-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'w-full max-w-md rounded-lg bg-surface p-token-6 shadow-[var(--shadow-pop)]',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <h2 className="mb-token-4 font-heading text-lg font-semibold text-ink">{title}</h2>
        ) : null}
        {children}
      </div>
    </div>
  );
}
