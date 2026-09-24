"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const dragItemHeightRef = useRef<number>(62);

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
      activePointerIdRef.current = null;
      setDraggedId(null);
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
  }, [saveQuestOrder, setQuests, removeDragListeners]);

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
      let calculatedHeight = 62;
      if (cardEl) {
        const rect = cardEl.getBoundingClientRect();
        const parentEl = cardEl.parentElement;
        const rowGap = parentEl ? parseFloat(window.getComputedStyle(parentEl).rowGap || "7") || 7 : 7;
        calculatedHeight = rect.height + rowGap;
      }

      setDragItemHeight(calculatedHeight);
      dragItemHeightRef.current = calculatedHeight;

      startPointerYRef.current = clientY;
      isDraggingRef.current = true;
      suppressClickRef.current = true;

      dragStartIndexRef.current = index;
      targetDropIndexRef.current = index;
      setDraggedId(questId);
      setDragStartIndex(index);
      setTargetDropIndex(index);
      setDragDeltaY(0);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(25);
      }

      document.body.style.userSelect = "none";
      document.body.style.touchAction = "none";
      document.body.style.cursor = "grabbing";

      // Attach active dragging listeners
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

        const h = dragItemHeightRef.current || 62;
        const slotsMoved = Math.round(deltaY / h);
        const list = activeQuestsRef.current;
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

  const handleCardPointerDown = useCallback(
    (event: React.PointerEvent, questId: string, groupKey?: string) => {
      if (event.button !== 0) return;

      const target = event.target as HTMLElement;
      if (
        target.closest(".completeButton") ||
        target.closest(".googleSubtaskCheckbox") ||
        target.closest(".subtasksCompletedToggle") ||
        target.closest(".googleDateBadge")
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

      const targetCard = (event.currentTarget as HTMLElement).closest(".questCard") as HTMLElement;
      draggedGroupKeyRef.current = groupKey ?? null;

      const onHoldMove = (moveEvt: PointerEvent) => {
        if (activePointerIdRef.current !== null && moveEvt.pointerId !== activePointerIdRef.current) return;
        latestPointerXRef.current = moveEvt.clientX;
        latestPointerYRef.current = moveEvt.clientY;
        const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY);
        // If moved more than 10px before the hold timer completes, user is scrolling or gesturing
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
        startDrag(questId, latestPointerYRef.current, groupKey, targetCard);
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

    const h = dragItemHeightRef.current || dragItemHeight || 62;
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
