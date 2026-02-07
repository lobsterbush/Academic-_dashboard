"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Detects user inactivity. Returns `true` when the user has been idle
 * for `timeoutMs` milliseconds. Resets on mouse, keyboard, touch, or scroll.
 */
export function useIdleDetection(timeoutMs: number = 5 * 60 * 1000) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    setIsIdle(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsIdle(true), timeoutMs);
  }, [timeoutMs]);

  const forceIdle = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsIdle(true);
  }, []);

  const wake = useCallback(() => {
    setIsIdle(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => document.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => document.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return { isIdle, forceIdle, wake };
}
