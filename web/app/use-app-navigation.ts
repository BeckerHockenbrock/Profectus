"use client";

import { useCallback } from "react";
import type React from "react";
import type { QuestView } from "@/features/quests/types/quest";

type UseAppNavigationOptions = {
  sheetOpen: boolean;
  setSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setQuestView: React.Dispatch<React.SetStateAction<QuestView>>;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useAppNavigation({
  sheetOpen,
  setSheetOpen,
  setQuestView,
}: UseAppNavigationOptions) {
  const navigateToView = useCallback((view: QuestView) => {
    if (sheetOpen) {
      setSheetOpen(false);
    }
    setQuestView(view);

    const taskHeading = document.getElementById("quest-heading") ?? document.getElementById("top");
    if (taskHeading) {
      taskHeading.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    }
  }, [setQuestView, setSheetOpen, sheetOpen]);

  return {
    handleDatesNavigation: () => navigateToView("dates"),
    handleAllNavigation: () => navigateToView("all"),
    handleCategoriesNavigation: () => navigateToView("categories"),
  };
}
