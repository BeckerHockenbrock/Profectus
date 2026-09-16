"use client";

import { useCallback, useRef } from "react";

type UseSheetSwipeOptions = {
  onClose: () => void;
  threshold?: number;
};

export function useSheetSwipe({
  onClose,
  threshold = 80,
}: UseSheetSwipeOptions) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const scrimRef = useRef<HTMLElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const currentDeltaYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    startYRef.current = e.clientY;
    currentDeltaYRef.current = 0;
    isDraggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

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
        const opacity = Math.max(0.15, 1 - deltaY / 320);
        scrimRef.current.style.opacity = String(opacity);
      }
    } else {
      currentDeltaYRef.current = 0;
      if (sheetRef.current) {
        sheetRef.current.style.transform = "translateY(0)";
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
      currentDeltaYRef.current = 0;

      if (deltaY > threshold) {
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
        }, 190);
      } else {
        if (sheetRef.current) {
          sheetRef.current.style.transition =
            "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
          sheetRef.current.style.transform = "translateY(0)";
        }
        if (scrimRef.current) {
          scrimRef.current.style.transition = "opacity 220ms ease";
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
