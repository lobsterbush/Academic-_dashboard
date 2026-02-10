"use client";

import { useState, useEffect, useCallback, useRef } from "react";

function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI;
}

function storageKeyToFileKey(key: string): string {
  if (key === "academic-dashboard") return "data";
  if (key === "academic-dashboard-settings") return "settings";
  return key;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load on mount
  useEffect(() => {
    async function load() {
      try {
        if (isElectron()) {
          const fileKey = storageKeyToFileKey(key);
          const result = await window.electronAPI!.storage.read(fileKey);
          if (result !== null && result !== undefined) {
            setStoredValue(result as T);
          }
        } else {
          const item = window.localStorage.getItem(key);
          if (item) {
            setStoredValue(JSON.parse(item));
          }
        }
      } catch (error) {
        console.warn(`Error reading storage key "${key}":`, error);
      }
      setIsHydrated(true);
    }
    load();
  }, [key]);

  // Persist helper
  const persist = useCallback(
    (data: T) => {
      if (isElectron()) {
        // Debounce writes to avoid hammering the file system
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          const fileKey = storageKeyToFileKey(key);
          window.electronAPI!.storage.write(fileKey, data);
        }, 100);
      } else {
        try {
          window.localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
          console.warn(`Error setting localStorage key "${key}":`, error);
        }
      }
    },
    [key]
  );

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        persist(valueToStore);
        return valueToStore;
      });
    },
    [persist]
  );

  return [storedValue, setValue, isHydrated] as const;
}
