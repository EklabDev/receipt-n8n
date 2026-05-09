import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

/**
 * A generic hook that persists state in localStorage.
 * Automatically serializes/deserializes with JSON.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Storage full or blocked — silently ignore
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
