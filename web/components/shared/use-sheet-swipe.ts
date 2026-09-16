"use client";

import { useCallback, useRef } from "react";

type UseSheetSwipeOptions = {
  onClose: () => void;
  threshold?: number;
};

export function useSheetSwipe({
  onClose,
  threshold = 55,
}: UseSheetSwipeOptions) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const scrimRef = useRef<HTMLElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const currentDeltaYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, input, textarea, a")) return;

    startYRef.current = e.clientY;
    startTimeRef.current = Date.now();
    currentDeltaYRef.current = 0;
    isDraggingRef.current = true;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || startYRef.current === null) return;
    const deltaY = e.clientY - startYRef.current;

    if (deltaY > 0) {
      currentDeltaYRef.current = deltaY;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
      if (scrimRef.current) {
        const opacity = Math.max(0.05, 1 - deltaY / 320);
        scrimRef.current.style.opacity = String(opacity);
      }
    } else {
      currentDeltaYRef.current = 0;
      if (sheetRef.current) {
        sheetRef.current.style.transform = "translateY(0)";
      }
      if (scrimRef.current) {
        scrimRef.current.style.opacity = "1";
      }
    }
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      startYRef.current = null;

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}

      const deltaY = currentDeltaYRef.current;
      const elapsed = Date.now() - startTimeRef.current;
      currentDeltaYRef.current = 0;

      // Check if dragged beyond threshold OR fast downward flick (> 30px in < 280ms)
      const isQuickFlick = deltaY > 30 && elapsed < 280;
      const isPastThreshold = deltaY > threshold;

      if (isQuickFlick || isPastThreshold) {
        if (sheetRef.current) {
          sheetRef.current.style.transition =
            "transform 200ms cubic-bezier(0.2, 0.9, 0.3, 1)";
          sheetRef.current.style.transform = "translateY(100%)";
        }
        if (scrimRef.current) {
          scrimRef.current.style.transition = "opacity 200ms ease";
          scrimRef.current.style.opacity = "0";
        }
        setTimeout(() => {
          onClose();
          // Reset inline styles so CSS classes take back control when reopened
          if (sheetRef.current) {
            sheetRef.current.style.transform = "";
            sheetRef.current.style.transition = "";
          }
          if (scrimRef.current) {
            scrimRef.current.style.opacity = "";
            scrimRef.current.style.transition = "";
          }
        }, 190);
      } else {
        if (sheetRef.current) {
          sheetRef.current.style.transition =
            "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
          sheetRef.current.style.transform = "translateY(0)";
        }
        if (scrimRef.current) {
          scrimRef.current.style.transition = "opacity 200ms ease";
          scrimRef.current.style.opacity = "1";
        }
      }
    },
    [onClose, threshold],
  );

  return {
    sheetRef,
    scrimRef,
    dragHandleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  };
}
