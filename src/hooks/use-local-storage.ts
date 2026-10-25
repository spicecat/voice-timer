import {useCallback, useEffect, useState} from 'react';

/**
 * Custom hook to sync state with localStorage with safety fallback for SSR/IFrame environments.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  legacyKey?: string,
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue;
      }
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsed = JSON.parse(item);
        if (parsed !== null && parsed !== undefined) {
          return parsed;
        }
      }
      if (legacyKey) {
        const legacyItem = window.localStorage.getItem(legacyKey);
        if (legacyItem !== null) {
          const parsed = JSON.parse(legacyItem);
          if (parsed !== null && parsed !== undefined) {
            return parsed;
          }
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore =
            typeof value === 'function'
              ? (value as (val: T) => T)(prev)
              : value;
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (storageError) {
              console.warn(
                `Failed to persist key "${key}" to localStorage:`,
                storageError,
              );
            }
          }
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed !== null && parsed !== undefined) {
            setStoredValue(parsed);
          }
        } catch {
          // Ignore parse errors from external events
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
