"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";

type UseFocusTimerOptions = {
  onQuit: () => void;
  isFinishingRef: React.MutableRefObject<boolean>;
  targetMinutes?: number | null;
};

export function useFocusTimer({
  onQuit,
  isFinishingRef,
  targetMinutes,
}: UseFocusTimerOptions) {
  const isCountdown = Boolean(targetMinutes && targetMinutes > 0);
  const targetMs = isCountdown ? (targetMinutes as number) * 60 * 1000 : null;

  const [isPaused, setIsPaused] = useState(false);
  const [displayMs, setDisplayMs] = useState(() => (targetMs !== null ? targetMs : 0));
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isGoalReached, setIsGoalReached] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const wasRunningBeforeQuitRef = useRef(false);
  const pauseButtonRef = useRef<HTMLButtonElement>(null);

  const getElapsedMs = useCallback(() => {
    if (isPausedRef.current) {
      return accumulatedMsRef.current;
    }
    const start = segmentStartRef.current;
    if (start === null) {
      return accumulatedMsRef.current;
    }
    return accumulatedMsRef.current + Math.max(0, Date.now() - start);
  }, []);

  // Initialize start timestamp, lock body scroll, and move focus on entry
  useEffect(() => {
    segmentStartRef.current = Date.now();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Auto-focus primary control
    const timer = setTimeout(() => {
      pauseButtonRef.current?.focus();
    }, 40);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Timer ticker and visibility/focus handlers to prevent background drift
  useEffect(() => {
    const updateDisplay = () => {
      const elapsed = getElapsedMs();
      setElapsedMs(elapsed);

      if (targetMs !== null) {
        const remaining = Math.max(0, targetMs - elapsed);
        setDisplayMs(remaining);
        if (elapsed >= targetMs) {
          setIsGoalReached(true);
        }
      } else {
        setDisplayMs(elapsed);
      }
    };

    const intervalId = setInterval(updateDisplay, 200);

    const handleSync = () => {
      updateDisplay();
    };

    document.addEventListener("visibilitychange", handleSync);
    window.addEventListener("focus", handleSync);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, [getElapsedMs, targetMs]);

  const handleTogglePause = useCallback(() => {
    if (isFinishingRef.current) return;

    if (isPausedRef.current) {
      // Resume
      segmentStartRef.current = Date.now();
      isPausedRef.current = false;
      setIsPaused(false);
      const elapsed = accumulatedMsRef.current;
      setElapsedMs(elapsed);
      if (targetMs !== null) {
        setDisplayMs(Math.max(0, targetMs - elapsed));
      } else {
        setDisplayMs(elapsed);
      }
    } else {
      // Pause
      const now = Date.now();
      const start = segmentStartRef.current ?? now;
      const elapsedSegment = Math.max(0, now - start);
      accumulatedMsRef.current += elapsedSegment;
      segmentStartRef.current = null;
      isPausedRef.current = true;
      setIsPaused(true);
      const elapsed = accumulatedMsRef.current;
      setElapsedMs(elapsed);
      if (targetMs !== null) {
        setDisplayMs(Math.max(0, targetMs - elapsed));
      } else {
        setDisplayMs(elapsed);
      }
    }
  }, [isFinishingRef, targetMs]);

  const handleQuitClick = useCallback(() => {
    if (isFinishingRef.current) return;

    const elapsed = getElapsedMs();
    if (elapsed < 1000) {
      // Immediate exit if no time has elapsed
      onQuit();
      return;
    }

    // Freeze motion/timer while quit confirmation is open
    if (!isPausedRef.current) {
      wasRunningBeforeQuitRef.current = true;
      handleTogglePause();
    } else {
      wasRunningBeforeQuitRef.current = false;
    }

    setShowQuitConfirm(true);
  }, [getElapsedMs, handleTogglePause, isFinishingRef, onQuit]);

  const confirmQuit = () => {
    setShowQuitConfirm(false);
    onQuit();
  };

  const cancelQuit = useCallback(() => {
    setShowQuitConfirm(false);
    if (wasRunningBeforeQuitRef.current && isPausedRef.current) {
      handleTogglePause();
    }
  }, [handleTogglePause]);

  const freezeTimer = useCallback(() => {
    const finalElapsedMs = getElapsedMs();
    if (!isPausedRef.current) {
      accumulatedMsRef.current = finalElapsedMs;
      isPausedRef.current = true;
      setIsPaused(true);
      setElapsedMs(finalElapsedMs);
      if (targetMs !== null) {
        setDisplayMs(Math.max(0, targetMs - finalElapsedMs));
      } else {
        setDisplayMs(finalElapsedMs);
      }
    }
    return finalElapsedMs;
  }, [getElapsedMs, targetMs]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showQuitConfirm) {
        if (event.key === "Escape") {
          event.preventDefault();
          cancelQuit();
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        handleQuitClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showQuitConfirm, handleQuitClick, cancelQuit]);

  return {
    isPaused,
    displayMs,
    elapsedMs,
    isGoalReached,
    isCountdown,
    targetMs,
    showQuitConfirm,
    pauseButtonRef,
    handleTogglePause,
    handleQuitClick,
    confirmQuit,
    cancelQuit,
    freezeTimer,
    getElapsedMs,
  };
}
