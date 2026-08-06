"use client";

import { useEffect, useState } from "react";

/** State mirrored into localStorage. Reads after mount so SSR output matches,
 *  which is why nothing is written until the first read has happened. */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      // corrupt or unavailable storage — fall back to the initial value
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or blocked — the values simply will not persist
    }
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}
