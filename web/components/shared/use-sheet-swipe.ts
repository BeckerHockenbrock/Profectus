"use client";

import { useCallback, useEffect, useRef } from "react";

type UseSheetSwipeOptions = {
  onClose: () => void;
  threshold?: number;
};

export function useSheetSwipe({
  onClose,
  threshold = 50,
}: UseSheetSwipeOptions) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const scrimRef = useRef<HTMLElement | null>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const isClosingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isTouchActiveRef = useRef(false);
  const currentDeltaYRef = useRef(0);

  // Velocity and touch tracking
  const velocityHistoryRef = useRef<Array<{ y: number; time: number }>>([]);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const isAtTopAtStartRef = useRef(true);

  // Desktop pointer tracking
  const pointerStartYRef = useRef<number | null>(null);
  const pointerStartTimeRef = useRef(0);
  const pointerVelocityHistoryRef = useRef<Array<{ y: number; time: number }>>([]);

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkShouldClose = useCallback(
    (
      deltaY: number,
      elapsedTotal: number,
      history: Array<{ y: number; time: number }>,
      thresholdLimit: number,
    ): { shouldClose: boolean; velocityY: number } => {
      const now = Date.now();
      // Inspect recent samples in the last 110ms to measure instantaneous release velocity
      const recent = history.filter((p) => now - p.time <= 110);
      let velocityY = 0; // px/ms
      if (recent.length >= 2) {
        const earliest = recent[0];
        const latest = recent[recent.length - 1];
        const dt = latest.time - earliest.time;
        if (dt > 8) {
          velocityY = (latest.y - earliest.y) / dt;
        }
      }

      // 1. Pulled beyond downward displacement threshold (default 50px)
      const isPastThreshold = deltaY >= thresholdLimit;

      // 2. Pulled down hard: high downward velocity even if short displacement (>= 14px)
      const isHardPullDown = velocityY >= 0.35 && deltaY >= 14;

      // 3. Medium-fast downward pull
      const isMediumFastPull = velocityY >= 0.20 && deltaY >= 26;

      // 4. Quick flick from touch start
      const isQuickFlick = deltaY >= 24 && elapsedTotal < 300 && velocityY > 0.12;

      const shouldClose = isPastThreshold || isHardPullDown || isMediumFastPull || isQuickFlick;
      return { shouldClose, velocityY };
    },
    [],
  );

  const animateClose = useCallback((velocityY: number) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    isDraggingRef.current = false;

    const sheet = sheetRef.current;
    const scrim = scrimRef.current;

    // Scale duration inversely with downward release velocity for natural momentum
    const duration = Math.max(
      150,
      Math.min(210, Math.round(200 - Math.min(Math.max(0, velocityY), 1.5) * 35)),
    );

    if (sheet) {
      sheet.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0.9, 0.3, 1)`;
      sheet.style.transform = "translateY(100%)";
    }
    if (scrim) {
      scrim.style.transition = `opacity ${duration}ms ease`;
      scrim.style.opacity = "0";
    }

    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      onCloseRef.current();
      if (sheetRef.current) {
        sheetRef.current.style.transform = "";
        sheetRef.current.style.transition = "";
      }
      if (scrimRef.current) {
        scrimRef.current.style.opacity = "";
        scrimRef.current.style.transition = "";
      }
      isClosingRef.current = false;
    }, Math.max(120, duration - 10));
  }, []);

  const animateSnapBack = useCallback(() => {
    isDraggingRef.current = false;
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;

    if (sheet) {
      sheet.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
      sheet.style.transform = "translateY(0)";
    }
    if (scrim) {
      scrim.style.transition = "opacity 200ms ease";
      scrim.style.opacity = "1";
    }

    if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    snapTimeoutRef.current = setTimeout(() => {
      if (!isDraggingRef.current && !isClosingRef.current) {
        if (sheetRef.current) {
          sheetRef.current.style.transform = "";
          sheetRef.current.style.transition = "";
        }
        if (scrimRef.current) {
          scrimRef.current.style.opacity = "";
          scrimRef.current.style.transition = "";
        }
      }
    }, 230);
  }, []);

  // Native touch handling on sheetRef to capture pull-down anywhere when at the top of the page
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const onTouchStart = (e: TouchEvent) => {
      if (isClosingRef.current) return;
      if (e.touches.length !== 1) return;

      isTouchActiveRef.current = true;
      const touch = e.touches[0];
      const target = touch.target as HTMLElement | null;

      // Do not hijack typing or text selection in inputs
      if (target?.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }

      // Do not hijack if dragging another item (e.g. subtask reorder)
      if (
        target?.closest("[data-dragging='true'], .isDragging") ||
        document.body.style.cursor === "grabbing"
      ) {
        return;
      }

      touchStartYRef.current = touch.clientY;
      touchStartXRef.current = touch.clientX;
      touchStartTimeRef.current = Date.now();
      currentDeltaYRef.current = 0;
      isDraggingRef.current = false;
      velocityHistoryRef.current = [{ y: touch.clientY, time: Date.now() }];

      // Check if already at the top of the page
      let isAtTop = sheet.scrollTop <= 0;
      let curr = target;
      while (curr && curr !== sheet) {
        if (curr.scrollTop > 0) {
          isAtTop = false;
          break;
        }
        curr = curr.parentElement;
      }
      isAtTopAtStartRef.current = isAtTop;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isClosingRef.current) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const currentY = touch.clientY;
      const currentX = touch.clientX;
      const deltaY = currentY - touchStartYRef.current;
      const deltaX = currentX - touchStartXRef.current;
      const target = touch.target as HTMLElement | null;

      if (target?.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }

      const isCurrentlyAtTop = sheet.scrollTop <= 0;

      // If dragging has not started yet
      if (!isDraggingRef.current) {
        // If user was scrolling up and has now reached the top, engage pull down
        if (isCurrentlyAtTop && !isAtTopAtStartRef.current && deltaY > 0) {
          touchStartYRef.current = currentY;
          touchStartXRef.current = currentX;
          touchStartTimeRef.current = Date.now();
          isAtTopAtStartRef.current = true;
          velocityHistoryRef.current = [{ y: currentY, time: Date.now() }];
          return;
        }

        // When already at the top of the page and pulling downward
        if (isCurrentlyAtTop && isAtTopAtStartRef.current) {
          const isHandle = Boolean(
            target?.closest(".sheetHandleArea, .detailModalHeader, .sheetHeading"),
          );
          const minDistance = isHandle ? 4 : target?.closest("button, a") ? 12 : 7;

          if (deltaY > minDistance && deltaY > Math.abs(deltaX * 1.05)) {
            isDraggingRef.current = true;
            sheet.style.transition = "none";
            velocityHistoryRef.current = [{ y: currentY, time: Date.now() }];
            if (e.cancelable) e.preventDefault();
          }
        }
      }

      // If dragging is active
      if (isDraggingRef.current) {
        if (e.cancelable) e.preventDefault();

        const now = Date.now();
        velocityHistoryRef.current.push({ y: currentY, time: now });
        const cutoff = now - 120;
        while (
          velocityHistoryRef.current.length > 1 &&
          velocityHistoryRef.current[0].time < cutoff
        ) {
          velocityHistoryRef.current.shift();
        }

        if (deltaY > 0) {
          currentDeltaYRef.current = deltaY;
          sheet.style.transform = `translateY(${deltaY}px)`;
          if (scrimRef.current) {
            const opacity = Math.max(0.05, 1 - deltaY / 320);
            scrimRef.current.style.opacity = String(opacity);
          }
        } else {
          currentDeltaYRef.current = 0;
          sheet.style.transform = "translateY(0)";
          if (scrimRef.current) {
            scrimRef.current.style.opacity = "1";
          }
        }
      }
    };

    const onTouchEnd = () => {
      setTimeout(() => {
        isTouchActiveRef.current = false;
      }, 250);

      if (isClosingRef.current) return;
      if (!isDraggingRef.current) return;

      const deltaY = currentDeltaYRef.current;
      const elapsed = Date.now() - touchStartTimeRef.current;
      const history = velocityHistoryRef.current;
      currentDeltaYRef.current = 0;
      velocityHistoryRef.current = [];

      const { shouldClose, velocityY } = checkShouldClose(
        deltaY,
        elapsed,
        history,
        threshold,
      );

      if (shouldClose) {
        animateClose(velocityY);
      } else {
        animateSnapBack();
      }
    };

    sheet.addEventListener("touchstart", onTouchStart, { passive: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false });
    sheet.addEventListener("touchend", onTouchEnd, { passive: true });
    sheet.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      sheet.removeEventListener("touchstart", onTouchStart);
      sheet.removeEventListener("touchmove", onTouchMove);
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    };
  }, [animateClose, animateSnapBack, checkShouldClose, threshold]);

  // Desktop pointer event handling for mouse/pen interactions on drag handles and headers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch" || isTouchActiveRef.current) return;
    if (e.button !== 0) return;
    if (isClosingRef.current) return;
    if ((e.target as HTMLElement).closest("button, input, textarea, a, select")) return;

    pointerStartYRef.current = e.clientY;
    pointerStartTimeRef.current = Date.now();
    currentDeltaYRef.current = 0;
    isDraggingRef.current = true;
    pointerVelocityHistoryRef.current = [{ y: e.clientY, time: Date.now() }];

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch" || isTouchActiveRef.current) return;
    if (!isDraggingRef.current || pointerStartYRef.current === null) return;

    const currentY = e.clientY;
    const deltaY = currentY - pointerStartYRef.current;

    const now = Date.now();
    pointerVelocityHistoryRef.current.push({ y: currentY, time: now });
    const cutoff = now - 120;
    while (
      pointerVelocityHistoryRef.current.length > 1 &&
      pointerVelocityHistoryRef.current[0].time < cutoff
    ) {
      pointerVelocityHistoryRef.current.shift();
    }

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
      if (e.pointerType === "touch" || isTouchActiveRef.current) return;
      if (!isDraggingRef.current) return;

      pointerStartYRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}

      const deltaY = currentDeltaYRef.current;
      const elapsed = Date.now() - pointerStartTimeRef.current;
      const history = pointerVelocityHistoryRef.current;
      currentDeltaYRef.current = 0;
      pointerVelocityHistoryRef.current = [];

      const { shouldClose, velocityY } = checkShouldClose(
        deltaY,
        elapsed,
        history,
        threshold,
      );

      if (shouldClose) {
        animateClose(velocityY);
      } else {
        animateSnapBack();
      }
    },
    [animateClose, animateSnapBack, checkShouldClose, threshold],
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
