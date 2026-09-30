'use client';

import * as React from 'react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Debounced autosave. Calls `save(value)` after `delay` ms of no changes.
 * Skips the very first value (the initial load) so we don't immediately
 * round-trip unchanged data. Serializes saves and coalesces rapid edits.
 *
 * `flush()` resolves to whether the LATEST value is safely saved. It waits for
 * a save already in flight rather than returning early — the old version
 * resolved immediately in that case, and callers (Next, Save & exit, Publish)
 * could not tell a failed save from a successful one, so the wizard moved on
 * while the edits were silently lost.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<void>,
  { delay = 900 }: { delay?: number } = {},
): { state: SaveState; flush: () => Promise<boolean>; error: string | null } {
  const [state, setState] = React.useState<SaveState>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const saveRef = React.useRef(save);
  saveRef.current = save;

  const serialized = React.useMemo(() => JSON.stringify(value), [value]);
  const serializedRef = React.useRef(serialized);
  serializedRef.current = serialized;
  const lastSavedRef = React.useRef<string | null>(null);
  const current = React.useRef<Promise<boolean> | null>(null);
  const valueRef = React.useRef(value);
  valueRef.current = value;

  /** Save whatever the latest value is; resolves true once it is persisted. */
  const saveLatest = React.useCallback(async (): Promise<boolean> => {
    // Let a running save finish first; it may already cover the latest value.
    while (current.current) await current.current;
    const snapshot = serializedRef.current;
    if (snapshot === lastSavedRef.current) return true;

    const run = (async () => {
      setState('saving');
      try {
        await saveRef.current(valueRef.current);
        lastSavedRef.current = snapshot;
        setError(null);
        setState('saved');
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setState('error');
        return false;
      }
    })();
    current.current = run;
    try {
      return await run;
    } finally {
      current.current = null;
    }
  }, []);

  // Capture the initial snapshot as already-saved.
  React.useEffect(() => {
    if (lastSavedRef.current === null) lastSavedRef.current = serialized;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (lastSavedRef.current === null || serialized === lastSavedRef.current) return;
    const id = setTimeout(() => void saveLatest(), delay);
    return () => clearTimeout(id);
  }, [serialized, delay, saveLatest]);

  const flush = React.useCallback(async () => {
    const ok = await saveLatest();
    // Edits typed while that save ran need their own round-trip.
    return ok && serializedRef.current !== lastSavedRef.current ? saveLatest() : ok;
  }, [saveLatest]);

  return { state, flush, error };
}
