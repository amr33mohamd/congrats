'use client';

import * as React from 'react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Debounced autosave. Calls `save(value)` after `delay` ms of no changes.
 * Skips the very first value (the initial load) so we don't immediately
 * round-trip unchanged data. Serializes saves and coalesces rapid edits.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<void>,
  { delay = 900 }: { delay?: number } = {},
): { state: SaveState; flush: () => Promise<void> } {
  const [state, setState] = React.useState<SaveState>('idle');
  const saveRef = React.useRef(save);
  saveRef.current = save;

  const serialized = React.useMemo(() => JSON.stringify(value), [value]);
  const lastSavedRef = React.useRef<string | null>(null);
  const inFlight = React.useRef(false);
  const pending = React.useRef<string | null>(null);
  const valueRef = React.useRef(value);
  valueRef.current = value;

  const runSave = React.useCallback(async (snapshot: string) => {
    if (inFlight.current) {
      pending.current = snapshot;
      return;
    }
    inFlight.current = true;
    setState('saving');
    try {
      await saveRef.current(valueRef.current);
      lastSavedRef.current = snapshot;
      setState('saved');
    } catch {
      setState('error');
    } finally {
      inFlight.current = false;
      if (pending.current && pending.current !== lastSavedRef.current) {
        const next = pending.current;
        pending.current = null;
        void runSave(next);
      }
    }
  }, []);

  // Capture the initial snapshot as already-saved.
  React.useEffect(() => {
    if (lastSavedRef.current === null) lastSavedRef.current = serialized;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (lastSavedRef.current === null || serialized === lastSavedRef.current) return;
    const id = setTimeout(() => void runSave(serialized), delay);
    return () => clearTimeout(id);
  }, [serialized, delay, runSave]);

  const flush = React.useCallback(async () => {
    if (serialized !== lastSavedRef.current) await runSave(serialized);
  }, [serialized, runSave]);

  return { state, flush };
}
