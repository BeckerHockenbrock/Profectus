"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Subtask } from "../types/quest";

type UseSubtaskReorderProps = {
  subtasks: Subtask[];
  onReorder?: (newSubtasks: Subtask[]) => void | Promise<boolean>;
};

export function useSubtaskReorder({
  subtasks,
  onReorder,
}: UseSubtaskReorderProps) {
  const [draggedSubtaskId, setDraggedSubtaskId] = useState<string | null>(null);
  const [dragStartIndex, setDragStartIndex] = useState<number>(-1);
  const [targetDropIndex, setTargetDropIndex] = useState<number>(-1);
  const [dragDeltaY, setDragDeltaY] = useState<number>(0);
  const [dragItemHeight, setDragItemHeight] = useState<number>(36);

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
  const dragItemHeightRef = useRef<number>(36);

  const subtasksRef = useRef(subtasks);
  const openSubtasksRef = useRef<Subtask[]>([]);

  useEffect(() => {
    subtasksRef.current = subtasks;
    openSubtasksRef.current = subtasks.filter((s) => !s.completed);
  }, [subtasks]);

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
      const openList = openSubtasksRef.current;

      if (from !== -1 && to !== -1 && from !== to && openList.length > 0) {
        const nextOpen = [...openList];
        const [moved] = nextOpen.splice(from, 1);
        nextOpen.splice(to, 0, moved);

        const completedPart = subtasksRef.current.filter((s) => s.completed);
        const nextSubtasks = [...nextOpen, ...completedPart];
        onReorder?.(nextSubtasks);
      }

      isDraggingRef.current = false;
      activePointerIdRef.current = null;
      setDraggedSubtaskId(null);
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
    (subtaskId: string, clientY: number, targetEl?: HTMLElement) => {
      const openList = subtasksRef.current.filter((s) => !s.completed);
      const index = openList.findIndex((s) => s.id === subtaskId);
      if (index === -1) return;

      openSubtasksRef.current = openList;

      let calculatedHeight = 36;
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const parentEl = targetEl.parentElement;
        const rowGap = parentEl ? parseFloat(window.getComputedStyle(parentEl).rowGap || "4") || 4 : 4;
        calculatedHeight = rect.height + rowGap;
      }

      setDragItemHeight(calculatedHeight);
      dragItemHeightRef.current = calculatedHeight;

      startPointerYRef.current = clientY;
      isDraggingRef.current = true;
      suppressClickRef.current = true;

      dragStartIndexRef.current = index;
      targetDropIndexRef.current = index;
      setDraggedSubtaskId(subtaskId);
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

        const deltaY = e.clientY - startPointerYRef.current;
        setDragDeltaY(deltaY);

        const h = dragItemHeightRef.current || 36;
        const slotsMoved = Math.round(deltaY / h);
        const list = openSubtasksRef.current;
        const fromIndex = dragStartIndexRef.current;
        const newTarget = Math.max(0, Math.min(list.length - 1, fromIndex + slotsMoved));

        if (targetDropIndexRef.current !== newTarget) {
          targetDropIndexRef.current = newTarget;
          setTargetDropIndex(newTarget);
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

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("contextmenu", onContextMenu);

      cleanupDragListenersRef.current = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("contextmenu", onContextMenu);
      };
    },
    [endDrag],
  );

  const handleSubtaskPointerDown = useCallback(
    (event: React.PointerEvent, subtaskId: string) => {
      if (event.button !== 0) return;

      const target = event.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest(".googleDateBadge") ||
        target.closest(".subtaskDatePlaceholder")
      ) {
        return;
      }

      event.stopPropagation();

      removeHoldListeners();
      removeDragListeners();

      const startX = event.clientX;
      const startY = event.clientY;
      latestPointerXRef.current = startX;
      latestPointerYRef.current = startY;
      activePointerIdRef.current = event.pointerId;

      const targetEl = event.currentTarget as HTMLElement;

      const onHoldMove = (moveEvt: PointerEvent) => {
        if (activePointerIdRef.current !== null && moveEvt.pointerId !== activePointerIdRef.current) return;
        latestPointerXRef.current = moveEvt.clientX;
        latestPointerYRef.current = moveEvt.clientY;
        const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY);
        if (dist > 10) {
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
        startDrag(subtaskId, latestPointerYRef.current, targetEl);
      }, 240);
    },
    [removeHoldListeners, removeDragListeners, startDrag],
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

  function getSubtaskTransformY(subtaskId: string): number {
    if (!draggedSubtaskId) return 0;
    if (draggedSubtaskId === subtaskId) return dragDeltaY;

    const openList = openSubtasksRef.current;
    const index = openList.findIndex((s) => s.id === subtaskId);
    if (index === -1) return 0;

    const h = dragItemHeightRef.current || dragItemHeight || 36;
    if (dragStartIndex < targetDropIndex) {
      if (index > dragStartIndex && index <= targetDropIndex) {
        return -h;
      }
    } else if (dragStartIndex > targetDropIndex) {
      if (index >= targetDropIndex && index < dragStartIndex) {
        return h;
      }
    }
    return 0;
  }

  return {
    draggedSubtaskId,
    suppressClickRef,
    handleSubtaskPointerDown,
    getSubtaskTransformY,
  };
}
