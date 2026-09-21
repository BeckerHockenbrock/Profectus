"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Quest, QuestView } from "../types/quest";
import { saveQuestOrderToFirestore } from "../data/quest-firestore";
import { getQuestSubtasksForDate, isQuestInDateGroup } from "../domain/date-utils";

type UseQuestReorderProps = {
  userId: string | null | undefined;
  quests: Quest[];
  openQuests: Quest[];
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
  view?: QuestView;
};

export function useQuestReorder({
  userId,
  quests,
  openQuests,
  setQuests,
  view = "all",
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
  const viewRef = useRef(view);
  const activeQuestsRef = useRef<Quest[]>([]);
  const draggedGroupKeyRef = useRef<string | null>(null);

  useEffect(() => {
    questsRef.current = quests;
    openQuestsRef.current = openQuests;
    viewRef.current = view;
  }, [quests, openQuests, view]);

  const saveQuestOrder = useCallback(
    async (reorderedQuests: Quest[]) => {
      if (!userId) return;
      await saveQuestOrderToFirestore(userId, reorderedQuests);
    },
    [userId],
  );

  const startDrag = useCallback(
    (questId: string, clientY: number, groupKey?: string, targetCard?: HTMLElement) => {
      const draggedQuest = questsRef.current.find((q) => q.id === questId);
      if (!draggedQuest) return;

      let activeList: Quest[];
      if (viewRef.current === "dates") {
        const activeDateKey = groupKey ?? draggedGroupKeyRef.current ?? draggedQuest.dueDate;
        activeList = questsRef.current.filter((q) => {
          if (!isQuestInDateGroup(q, activeDateKey)) return false;
          if (q.completed) return false;
          if (q.dueDate === activeDateKey) return true;
          const dateSubtasks = getQuestSubtasksForDate(q, activeDateKey) ?? [];
          return dateSubtasks.some((st) => !st.completed);
        });
      } else if (viewRef.current === "categories") {
        const activeCat = groupKey ?? draggedGroupKeyRef.current ?? draggedQuest.category;
        activeList = questsRef.current.filter((q) => !q.completed && q.category === activeCat);
      } else {
        activeList = openQuestsRef.current;
      }

      const index = activeList.findIndex((q) => q.id === questId);
      if (index === -1) return;

      activeQuestsRef.current = activeList;

      const cardEl = targetCard ?? (document.querySelector(`[data-quest-id="${questId}"]`) as HTMLElement);
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
    },
    [],
  );

  const handleCardPointerDown = useCallback(
    (event: React.PointerEvent, questId: string, isHandle?: boolean, groupKey?: string) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest(".completeButton")) return;

      const clientY = event.clientY;
      const clientX = event.clientX;
      const targetCard = (event.currentTarget as HTMLElement).closest(".questCard") as HTMLElement;

      draggedGroupKeyRef.current = groupKey ?? null;

      if (isHandle) {
        event.preventDefault();
        startDrag(questId, clientY, groupKey, targetCard);
        return;
      }

      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }

      holdTimerRef.current = setTimeout(() => {
        startDrag(questId, clientY, groupKey, targetCard);
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
      const activeList = activeQuestsRef.current;
      const newTarget = Math.max(0, Math.min(activeList.length - 1, dragStartIndex + slotsMoved));

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
        const activeList = activeQuestsRef.current;

        if (from !== -1 && to !== -1 && from !== to && activeList.length > 0) {
          const nextActive = [...activeList];
          const [moved] = nextActive.splice(from, 1);
          nextActive.splice(to, 0, moved);

          if (viewRef.current === "all") {
            const completedPart = questsRef.current.filter((q) => q.completed);
            const next = [...nextActive, ...completedPart];
            setQuests(next);
            saveQuestOrder(next);
          } else {
            const activeIdSet = new Set(nextActive.map((q) => q.id));
            let nextActiveIdx = 0;
            const next = questsRef.current.map((q) => {
              if (activeIdSet.has(q.id)) {
                const replacement = nextActive[nextActiveIdx];
                nextActiveIdx++;
                return replacement;
              }
              return q;
            });
            setQuests(next);
            saveQuestOrder(next);
          }
        }

        isDraggingRef.current = false;
        activeQuestsRef.current = [];
        draggedGroupKeyRef.current = null;
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

  function getCardTransformY(questId: string, groupKey?: string): number {
    if (!draggedId) return 0;
    if (draggedId === questId) return dragDeltaY;

    let activeList: Quest[];
    if (view === "dates") {
      const activeDateKey = groupKey ?? "";
      const draggedQuest = quests.find((q) => q.id === draggedId);
      if (!draggedQuest || !isQuestInDateGroup(draggedQuest, activeDateKey)) {
        return 0;
      }
      activeList = quests.filter((q) => {
        if (!isQuestInDateGroup(q, activeDateKey)) return false;
        if (q.completed) return false;
        if (q.dueDate === activeDateKey) return true;
        const dateSubtasks = getQuestSubtasksForDate(q, activeDateKey) ?? [];
        return dateSubtasks.some((st) => !st.completed);
      });
    } else if (view === "categories") {
      const activeCat = groupKey ?? "";
      const draggedQuest = quests.find((q) => q.id === draggedId);
      if (!draggedQuest || draggedQuest.category !== activeCat) {
        return 0;
      }
      activeList = quests.filter((q) => !q.completed && q.category === activeCat);
    } else {
      activeList = openQuests;
    }

    const index = activeList.findIndex((q) => q.id === questId);
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
