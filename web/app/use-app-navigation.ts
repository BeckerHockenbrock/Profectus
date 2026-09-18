"use client";

import { useCallback } from "react";
import type React from "react";
import type { AppTab } from "@/components/navigation/liquid-dock";

type UseAppNavigationOptions = {
  sheetOpen: boolean;
  setSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTab: React.Dispatch<React.SetStateAction<AppTab>>;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useAppNavigation({
  sheetOpen,
  setSheetOpen,
  setActiveTab,
}: UseAppNavigationOptions) {
  const navigateToTab = useCallback((tab: AppTab) => {
    if (sheetOpen) {
      setSheetOpen(false);
    }
    setActiveTab(tab);

    const targetHeading =
      tab === "tasks"
        ? (document.getElementById("quest-heading") ?? document.getElementById("top"))
        : document.getElementById("top");

    if (targetHeading) {
      targetHeading.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    }
  }, [setActiveTab, setSheetOpen, sheetOpen]);

  return {
    handleTasksNavigation: () => navigateToTab("tasks"),
    handleSchoolNavigation: () => navigateToTab("school"),
    handleConstructionNavigation: () => navigateToTab("construction"),
  };
}
