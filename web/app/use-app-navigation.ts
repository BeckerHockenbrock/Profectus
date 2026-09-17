"use client";

import { useCallback } from "react";
import type React from "react";
import type { QuestView } from "@/features/quests/types/quest";

export type ActiveTab = "tasks" | "school" | "stats";

type UseAppNavigationOptions = {
  activeTab: ActiveTab;
  sheetOpen: boolean;
  setActiveTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
  setSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setQuestView: React.Dispatch<React.SetStateAction<QuestView>>;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useAppNavigation({
  activeTab,
  sheetOpen,
  setActiveTab,
  setSheetOpen,
  setQuestView,
}: UseAppNavigationOptions) {
  const handleHomeNavigation = useCallback(() => {
    if (activeTab !== "tasks") {
      setActiveTab("tasks");
    }
    if (sheetOpen) {
      setSheetOpen(false);
    }
    setQuestView("dates");

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
  }, [activeTab, setActiveTab, setQuestView, setSheetOpen, sheetOpen]);

  const handleSchoolNavigation = useCallback(() => {
    if (sheetOpen) {
      setSheetOpen(false);
    }
    setActiveTab("school");
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [setActiveTab, setSheetOpen, sheetOpen]);

  const handleStatsNavigation = useCallback(() => {
    if (sheetOpen) {
      setSheetOpen(false);
    }
    setActiveTab("stats");
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [setActiveTab, setSheetOpen, sheetOpen]);

  return {
    handleHomeNavigation,
    handleSchoolNavigation,
    handleStatsNavigation,
  };
}
