import * as React from 'react';
import { cn } from '@/components/ui/cn';

/**
 * Deterministic decorative QR placeholder. A real QR is out of scope (no QR
 * dependency added); this renders a stable pseudo-QR pattern derived from the
 * value so the share UI looks complete. Reviewer may swap in a real QR lib
 * (see needsFromOthers).
 */
export function QrPlaceholder({
  value,
  size = 160,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const cells = 21;
  const bits = React.useMemo(() => hashGrid(value, cells), [value]);

  return (
    <div
      className={cn('rounded-lg bg-white p-token-3 shadow-[var(--shadow-card)]', className)}
      role="img"
      aria-label="QR code"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${cells} ${cells}`}
        shapeRendering="crispEdges"
      >
        <rect width={cells} height={cells} fill="white" />
        {bits.map((row, y) =>
          row.map((on, x) =>
            on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#141010" /> : null,
          ),
        )}
        {/* finder squares for QR-like look */}
        {finder(0, 0)}
        {finder(cells - 7, 0)}
        {finder(0, cells - 7)}
      </svg>
    </div>
  );
}

function finder(ox: number, oy: number) {
  return (
    <g key={`f-${ox}-${oy}`} fill="#141010">
      <rect x={ox} y={oy} width={7} height={1} />
      <rect x={ox} y={oy + 6} width={7} height={1} />
      <rect x={ox} y={oy} width={1} height={7} />
      <rect x={ox + 6} y={oy} width={1} height={7} />
      <rect x={ox + 2} y={oy + 2} width={3} height={3} />
    </g>
  );
}

function hashGrid(value: string, n: number): boolean[][] {
  // Simple xorshift seeded by the string — deterministic, not cryptographic.
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
  const grid: boolean[][] = [];
  for (let y = 0; y < n; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < n; x++) {
      const inFinder =
        (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      row.push(inFinder ? false : rand() > 0.55);
    }
    grid.push(row);
  }
  return grid;
}
