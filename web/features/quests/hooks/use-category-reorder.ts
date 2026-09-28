"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseCategoryReorderProps = {
  categories: string[];
  onReorder?: (newCategories: string[]) => void;
};

export function useCategoryReorder({
  categories,
  onReorder,
}: UseCategoryReorderProps) {
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [dragStartIndex, setDragStartIndex] = useState<number>(-1);
  const [targetDropIndex, setTargetDropIndex] = useState<number>(-1);
  const [dragDeltaY, setDragDeltaY] = useState<number>(0);

  const startPointerYRef = useRef<number>(0);
  const latestPointerYRef = useRef<number>(0);
  const latestPointerXRef = useRef<number>(0);
  const activePointerIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupHoldListenersRef = useRef<(() => void) | null>(null);
  const cleanupDragListenersRef = useRef<(() => void) | null>(null);
  const suppressClickRef = useRef<boolean>(false);

  const dragStartIndexRef = useRef<number>(-1);
  const targetDropIndexRef = useRef<number>(-1);
  const draggedHeightRef = useRef<number>(100);
  const gapRef = useRef<number>(32);
  const categoriesRef = useRef(categories);
  const orderedMidpointsRef = useRef<number[]>([]);

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  const removeDragListeners = useCallback(() => {
    if (cleanupDragListenersRef.current) {
      cleanupDragListenersRef.current();
      cleanupDragListenersRef.current = null;
    }
  }, []);

  const removeHoldListeners = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (cleanupHoldListenersRef.current) {
      cleanupHoldListenersRef.current();
      cleanupHoldListenersRef.current = null;
    }
  }, []);

  const endDrag = useCallback(() => {
    removeDragListeners();

    if (isDraggingRef.current) {
      const from = dragStartIndexRef.current;
      const to = targetDropIndexRef.current;
      const currentList = categoriesRef.current;

      if (from !== -1 && to !== -1 && from !== to && currentList.length > 0) {
        const next = [...currentList];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onReorder?.(next);
      }

      isDraggingRef.current = false;
      activePointerIdRef.current = null;
      setDraggedCategory(null);
      setDragStartIndex(-1);
      setTargetDropIndex(-1);
      dragStartIndexRef.current = -1;
      targetDropIndexRef.current = -1;
      setDragDeltaY(0);

      document.body.style.userSelect = "";
      document.body.style.touchAction = "";
      document.body.style.cursor = "";

      setTimeout(() => {
        suppressClickRef.current = false;
      }, 220);
    }
  }, [onReorder, removeDragListeners]);

  const startDrag = useCallback(
    (category: string, clientY: number, targetSection?: HTMLElement) => {
      const currentList = categoriesRef.current;
      const index = currentList.indexOf(category);
      if (index === -1 || currentList.length <= 1) return;

      const heights = new Map<string, number>();
      const midpoints = new Map<string, number>();

      const sectionEls = Array.from(
        document.querySelectorAll<HTMLElement>(".categoryGroup[data-category]")
      );
      sectionEls.forEach((el) => {
        const cat = el.getAttribute("data-category");
        if (cat) {
          const rect = el.getBoundingClientRect();
          heights.set(cat, rect.height);
          midpoints.set(cat, rect.top + rect.height / 2);
        }
      });

      const parentEl = targetSection?.parentElement;
      const rowGap = parentEl
        ? parseFloat(window.getComputedStyle(parentEl).rowGap || "32") || 32
        : 32;
      gapRef.current = rowGap;

      const measuredHeight =
        (targetSection ? targetSection.getBoundingClientRect().height : heights.get(category)) || 100;
      draggedHeightRef.current = measuredHeight;

      orderedMidpointsRef.current = currentList.map((cat, i) => {
        const measured = midpoints.get(cat);
        if (measured !== undefined) return measured;
        return (targetSection?.getBoundingClientRect().top ?? 0) + i * (measuredHeight + rowGap);
      });

      startPointerYRef.current = clientY;
      isDraggingRef.current = true;
      suppressClickRef.current = true;

      dragStartIndexRef.current = index;
      targetDropIndexRef.current = index;
      setDraggedCategory(category);
      setDragStartIndex(index);
      setTargetDropIndex(index);
      setDragDeltaY(0);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(25);
      }

      document.body.style.userSelect = "none";
      document.body.style.touchAction = "none";
      document.body.style.cursor = "grabbing";

      const onPointerMove = (e: PointerEvent) => {
        if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
        e.preventDefault();

        if (e.clientY < 110) {
          window.scrollBy({ top: -8, behavior: "auto" });
        } else if (e.clientY > window.innerHeight - 110) {
          window.scrollBy({ top: 8, behavior: "auto" });
        }

        const deltaY = e.clientY - startPointerYRef.current;
        setDragDeltaY(deltaY);

        const midpointsArr = orderedMidpointsRef.current;
        const fromIdx = dragStartIndexRef.current;
        const startCenter = midpointsArr[fromIdx] ?? 0;
        const currentCenter = startCenter + deltaY;

        let bestIndex = fromIdx;
        let bestDist = Infinity;
        for (let k = 0; k < midpointsArr.length; k++) {
          const dist = Math.abs(currentCenter - midpointsArr[k]);
          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = k;
          }
        }

        if (targetDropIndexRef.current !== bestIndex) {
          targetDropIndexRef.current = bestIndex;
          setTargetDropIndex(bestIndex);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(8);
          }
        }
      };

      const onTouchMove = (e: TouchEvent) => {
        if (e.cancelable) {
          e.preventDefault();
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
        endDrag();
      };

      const onContextMenu = (e: MouseEvent) => {
        e.preventDefault();
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          removeDragListeners();
          isDraggingRef.current = false;
          activePointerIdRef.current = null;
          setDraggedCategory(null);
          setDragStartIndex(-1);
          setTargetDropIndex(-1);
          dragStartIndexRef.current = -1;
          targetDropIndexRef.current = -1;
          setDragDeltaY(0);
          document.body.style.userSelect = "";
          document.body.style.touchAction = "";
          document.body.style.cursor = "";
          setTimeout(() => {
            suppressClickRef.current = false;
          }, 220);
        }
      };

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("contextmenu", onContextMenu);
      window.addEventListener("keydown", onKeyDown);

      cleanupDragListenersRef.current = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("contextmenu", onContextMenu);
        window.removeEventListener("keydown", onKeyDown);
      };
    },
    [endDrag, removeDragListeners],
  );

  const handleCategoryPointerDown = useCallback(
    (event: React.PointerEvent, category: string) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest(".questCard") ||
        target.closest(".completedSection")
      ) {
        return;
      }

      removeHoldListeners();
      removeDragListeners();

      const startX = event.clientX;
      const startY = event.clientY;
      latestPointerXRef.current = startX;
      latestPointerYRef.current = startY;
      activePointerIdRef.current = event.pointerId;

      const targetSection = (event.currentTarget as HTMLElement).closest(".categoryGroup") as HTMLElement;
      const isHandle = Boolean(
        target.closest(".categoryDragGrip") || target.closest(".categoryDragHandle")
      );

      const onHoldMove = (moveEvt: PointerEvent) => {
        if (activePointerIdRef.current !== null && moveEvt.pointerId !== activePointerIdRef.current) return;
        latestPointerXRef.current = moveEvt.clientX;
        latestPointerYRef.current = moveEvt.clientY;
        const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY);

        if (isHandle && moveEvt.pointerType === "mouse" && dist > 3) {
          removeHoldListeners();
          startDrag(category, latestPointerYRef.current, targetSection);
          return;
        }

        if (dist > 12) {
          removeHoldListeners();
          activePointerIdRef.current = null;
        }
      };

      const onHoldUp = (upEvt: PointerEvent) => {
        if (activePointerIdRef.current !== null && upEvt.pointerId !== activePointerIdRef.current) return;
        removeHoldListeners();
        activePointerIdRef.current = null;
      };

      const onHoldCancel = (cancelEvt: PointerEvent) => {
        if (activePointerIdRef.current !== null && cancelEvt.pointerId !== activePointerIdRef.current) return;
        removeHoldListeners();
        activePointerIdRef.current = null;
      };

      const onContextMenu = (menuEvt: MouseEvent) => {
        if (holdTimerRef.current || isDraggingRef.current) {
          menuEvt.preventDefault();
        }
      };

      window.addEventListener("pointermove", onHoldMove, { passive: true });
      window.addEventListener("pointerup", onHoldUp, { once: true });
      window.addEventListener("pointercancel", onHoldCancel, { once: true });
      window.addEventListener("contextmenu", onContextMenu);

      cleanupHoldListenersRef.current = () => {
        window.removeEventListener("pointermove", onHoldMove);
        window.removeEventListener("pointerup", onHoldUp);
        window.removeEventListener("pointercancel", onHoldCancel);
        window.removeEventListener("contextmenu", onContextMenu);
      };

      holdTimerRef.current = setTimeout(() => {
        removeHoldListeners();
        startDrag(category, latestPointerYRef.current, targetSection);
      }, 220);
    },
    [removeHoldListeners, removeDragListeners, startDrag],
  );

  const handleCategoryKeyDown = useCallback(
    (event: React.KeyboardEvent, category: string) => {
      const idx = categoriesRef.current.indexOf(category);
      if (idx === -1) return;

      if (event.key === "ArrowUp" && (event.altKey || event.metaKey)) {
        event.preventDefault();
        if (idx > 0) {
          const next = [...categoriesRef.current];
          const [moved] = next.splice(idx, 1);
          next.splice(idx - 1, 0, moved);
          onReorder?.(next);
        }
      } else if (event.key === "ArrowDown" && (event.altKey || event.metaKey)) {
        event.preventDefault();
        if (idx < categoriesRef.current.length - 1) {
          const next = [...categoriesRef.current];
          const [moved] = next.splice(idx, 1);
          next.splice(idx + 1, 0, moved);
          onReorder?.(next);
        }
      }
    },
    [onReorder],
  );

  useEffect(() => {
    return () => {
      removeHoldListeners();
      removeDragListeners();
      document.body.style.userSelect = "";
      document.body.style.touchAction = "";
      document.body.style.cursor = "";
    };
  }, [removeHoldListeners, removeDragListeners]);

  function getCategoryTransformY(category: string): number {
    if (!draggedCategory) return 0;
    if (draggedCategory === category) return dragDeltaY;

    const currentList = categories;
    const from = dragStartIndex;
    const to = targetDropIndex;
    const catIndex = currentList.indexOf(category);
    if (catIndex === -1 || from === -1 || to === -1) return 0;

    const shiftAmount = (draggedHeightRef.current || 100) + (gapRef.current || 32);

    if (from < to) {
      if (catIndex > from && catIndex <= to) {
        return -shiftAmount;
      }
    } else if (from > to) {
      if (catIndex >= to && catIndex < from) {
        return shiftAmount;
      }
    }
    return 0;
  }

  return {
    draggedCategory,
    isCategoryDragging: draggedCategory !== null,
    categorySuppressClickRef: suppressClickRef,
    handleCategoryPointerDown,
    handleCategoryKeyDown,
    getCategoryTransformY,
  };
}
