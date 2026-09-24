"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the screen awake using the Screen Wake Lock API when `enabled` is true.
 * Automatically handles:
 * - Requesting screen wake lock when enabled.
 * - Releasing wake lock when disabled or unmounted.
 * - Re-acquiring wake lock on `visibilitychange` (browsers release wake locks when switching tabs/apps).
 * - Safe graceful fallback on unsupported browsers or battery-saver restrictions.
 */
export function useWakeLock(enabled: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
      return;
    }

    let isMounted = true;

    async function requestLock() {
      if (typeof window === "undefined" || !("wakeLock" in navigator)) {
        return;
      }

      // If we already hold an active, unreleased lock, no need to request again
      if (sentinelRef.current && !sentinelRef.current.released) {
        return;
      }

      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (!isMounted) {
          sentinel.release().catch(() => {});
          return;
        }

        sentinelRef.current = sentinel;

        sentinel.addEventListener("release", () => {
          if (sentinelRef.current === sentinel) {
            sentinelRef.current = null;
          }
        });
      } catch (err) {
        // May fail if tab is not visible, battery saver is active, or permissions denied
        console.debug("Wake Lock request rejected:", err);
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && enabled) {
        requestLock();
      }
    };

    requestLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };
  }, [enabled]);
}
