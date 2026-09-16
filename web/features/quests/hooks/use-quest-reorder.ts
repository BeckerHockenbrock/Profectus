"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Quest } from "../types/quest";
import { saveQuestOrderToFirestore } from "../data/quest-firestore";

type UseQuestReorderProps = {
  userId: string | null | undefined;
  quests: Quest[];
  openQuests: Quest[];
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
};

export function useQuestReorder({
  userId,
  quests,
  openQuests,
  setQuests,
}: UseQuestReorderProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragStartIndex, setDragStartIndex] = useState<number>(-1);
  const [targetDropIndex, setTargetDropIndex] = useState<number>(-1);
  const [dragDeltaY, setDragDeltaY] = useState<number>(0);
  const [dragItemHeight, setDragItemHeight] = useState<number>(62);

  const startPointerYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef<boolean>(false);
  const questsRef = useRef(quests);
  const openQuestsRef = useRef(openQuests);

  useEffect(() => {
    questsRef.current = quests;
    openQuestsRef.current = openQuests;
  }, [quests, openQuests]);

  const saveQuestOrder = useCallback(
    async (reorderedQuests: Quest[]) => {
      if (!userId) return;
      await saveQuestOrderToFirestore(userId, reorderedQuests);
    },
    [userId],
  );

  const startDrag = useCallback((questId: string, clientY: number) => {
    const index = openQuestsRef.current.findIndex((q) => q.id === questId);
    if (index === -1) return;

    const cardEl = document.querySelector(`[data-quest-id="${questId}"]`) as HTMLElement;
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      const parentEl = cardEl.parentElement;
      const rowGap = parentEl ? parseFloat(window.getComputedStyle(parentEl).rowGap || "7") || 7 : 7;
      setDragItemHeight(rect.height + rowGap);
    }

    startPointerYRef.current = clientY;
    isDraggingRef.current = true;
    setDraggedId(questId);
    setDragStartIndex(index);
    setTargetDropIndex(index);
    setDragDeltaY(0);
    suppressClickRef.current = true;

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(18);
    }
    document.body.style.userSelect = "none";
    document.body.style.touchAction = "none";
  }, []);

  const handleCardPointerDown = useCallback(
    (event: React.PointerEvent, questId: string, isHandle?: boolean) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest(".completeButton")) return;

      const clientY = event.clientY;
      const clientX = event.clientX;

      if (isHandle) {
        event.preventDefault();
        startDrag(questId, clientY);
        return;
      }

      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }

      holdTimerRef.current = setTimeout(() => {
        startDrag(questId, clientY);
      }, 200);

      const onCancelCheck = () => {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        window.removeEventListener("pointermove", onCheckMove);
        window.removeEventListener("pointerup", onCancelCheck);
        window.removeEventListener("pointercancel", onCancelCheck);
      };

      const onCheckMove = (moveEvt: PointerEvent) => {
        const dist = Math.hypot(moveEvt.clientX - clientX, moveEvt.clientY - clientY);
        if (dist > 16) {
          onCancelCheck();
        }
      };

      window.addEventListener("pointermove", onCheckMove, { passive: true });
      window.addEventListener("pointerup", onCancelCheck, { once: true });
      window.addEventListener("pointercancel", onCancelCheck, { once: true });
    },
    [startDrag],
  );

  // Global window listeners while dragging
  useEffect(() => {
    if (!draggedId) return;

    const onPointerMove = (e: PointerEvent) => {
      e.preventDefault();

      if (e.clientY < 110) {
        window.scrollBy({ top: -8, behavior: "auto" });
      } else if (e.clientY > window.innerHeight - 110) {
        window.scrollBy({ top: 8, behavior: "auto" });
      }

      const deltaY = e.clientY - startPointerYRef.current;
      setDragDeltaY(deltaY);

      const h = dragItemHeight || 62;
      const slotsMoved = Math.round(deltaY / h);
      const newTarget = Math.max(0, Math.min(openQuestsRef.current.length - 1, dragStartIndex + slotsMoved));

      setTargetDropIndex((prev) => {
        if (prev !== newTarget && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(8);
        }
        return newTarget;
      });
    };

    const onPointerUp = () => {
      if (isDraggingRef.current) {
        const from = dragStartIndex;
        const to = targetDropIndex;

        if (from !== -1 && to !== -1 && from !== to) {
          const nextOpen = [...openQuestsRef.current];
          const [moved] = nextOpen.splice(from, 1);
          nextOpen.splice(to, 0, moved);
          const completedPart = questsRef.current.filter((q) => q.completed);
          const next = [...nextOpen, ...completedPart];
          setQuests(next);
          saveQuestOrder(next);
        }

        isDraggingRef.current = false;
        setDraggedId(null);
        setDragStartIndex(-1);
        setTargetDropIndex(-1);
        setDragDeltaY(0);
        document.body.style.userSelect = "";
        document.body.style.touchAction = "";

        setTimeout(() => {
          suppressClickRef.current = false;
        }, 180);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [draggedId, dragStartIndex, targetDropIndex, dragItemHeight, saveQuestOrder, setQuests]);

  function getCardTransformY(questId: string): number {
    if (!draggedId) return 0;
    if (draggedId === questId) return dragDeltaY;

    const index = openQuests.findIndex((q) => q.id === questId);
    if (index === -1) return 0;

    const h = dragItemHeight || 62;
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
    draggedId,
    suppressClickRef,
    handleCardPointerDown,
    getCardTransformY,
  };
}
