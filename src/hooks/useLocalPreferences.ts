import { useCallback, useState } from 'react';

/** useState that persists to localStorage (JSON). Falls back to memory if storage is unavailable. */
export function useLocalPreferences<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // ignore storage errors
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}
