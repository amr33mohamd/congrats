'use client';

/**
 * Dense presentational primitives shared across admin pages:
 * page header, data table, async states, right-side drawer, status badges.
 * All RTL-safe via logical properties.
 */
import * as React from 'react';
import { Badge, Button, Spinner, cn } from '@/components/ui';

/* ───────────────────────────── Page header ────────────────────────── */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-token-6 flex flex-wrap items-end justify-between gap-token-3">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">{title}</h1>
        {subtitle ? <p className="mt-token-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-token-2">{actions}</div> : null}
    </div>
  );
}

/* ───────────────────────────── Async states ───────────────────────── */

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-token-2 py-token-8 text-sm text-muted">
      <Spinner /> {label}
    </div>
  );
}

export function ErrorState({ label, onRetry }: { label: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-token-3 rounded-lg border border-danger/20 bg-danger/5 py-token-8 text-center">
      <p className="text-sm text-danger">{label}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          ↻
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface-2 py-token-8 text-center text-sm text-muted">
      {label}
    </div>
  );
}

/* ───────────────────────────── Data table ─────────────────────────── */

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]">
      <table className="w-full border-collapse text-start text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
      <tr>{children}</tr>
    </thead>
  );
}

export function TH({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn('whitespace-nowrap px-token-4 py-token-3 text-start font-medium', className)}>
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TR({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        onClick && 'cursor-pointer',
        'transition-colors hover:bg-surface-2',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn('px-token-4 py-token-3 align-middle text-ink', className)}>{children}</td>
  );
}

/* ───────────────────────────── Status badges ──────────────────────── */

const ORDER_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'danger' | 'warning'> = {
  pending: 'warning',
  submitted: 'brand',
  approved: 'success',
  rejected: 'danger',
  refunded: 'neutral',
};

export function OrderStatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge tone={ORDER_TONE[status] ?? 'neutral'}>{label}</Badge>;
}

const TEMPLATE_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'warning'> = {
  draft: 'neutral',
  published: 'success',
  archived: 'warning',
};

export function TemplateStatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge tone={TEMPLATE_TONE[status] ?? 'neutral'}>{label}</Badge>;
}

/* ───────────────────────────── Drawer ─────────────────────────────── */

/**
 * Right-side (inline-end) slide-over panel. RTL-aware via inset-inline-end.
 * Closes on backdrop click + Escape.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
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
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'flex h-[100dvh] w-full flex-col bg-surface shadow-[var(--shadow-pop)]',
          wide ? 'max-w-2xl' : 'max-w-lg',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-token-6 py-token-4">
          <h2 className="font-heading text-lg font-semibold text-ink">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="close">
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-token-6 py-token-4">{children}</div>
        {footer ? (
          <div className="border-t border-border px-token-6 py-token-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ───────────────────────────── Form field ─────────────────────────── */

export function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-token-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-token-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-token-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-pill transition-colors',
          checked ? 'bg-brand' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-pill bg-white shadow transition-transform',
            checked ? 'translate-x-[1.375rem] rtl:-translate-x-[1.375rem]' : 'translate-x-0.5 rtl:-translate-x-0.5',
          )}
        />
      </button>
      <span className="text-sm text-ink">{label}</span>
    </label>
  );
}
