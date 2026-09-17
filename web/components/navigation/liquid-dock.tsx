"use client";

import type { QuestView } from "@/features/quests/types/quest";

type TaskDockProps = {
  activeView: QuestView;
  onNavigateDates: () => void;
  onNavigateAll: () => void;
  onNavigateCategories: () => void;
  onOpenNewQuest: () => void;
};

export function LiquidDock({
  activeView,
  onNavigateDates,
  onNavigateAll,
  onNavigateCategories,
  onOpenNewQuest,
}: TaskDockProps) {
  return (
    <nav className="liquidGlassDock" aria-label="Task navigation">
      <button
        type="button"
        className={`dockItem ${activeView === "dates" ? "isActive" : ""}`}
        aria-current={activeView === "dates" ? "page" : undefined}
        onClick={onNavigateDates}
      >
        <svg className="dockIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <path d="M9 22v-7h6v7" />
        </svg>
        <span>Today</span>
      </button>

      <button
        type="button"
        className={`dockItem ${activeView === "all" ? "isActive" : ""}`}
        aria-current={activeView === "all" ? "page" : undefined}
        onClick={onNavigateAll}
      >
        <svg className="dockIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 6h11" />
          <path d="M9 12h11" />
          <path d="M9 18h11" />
          <path d="m3 6 1 1 2-2" />
          <path d="m3 12 1 1 2-2" />
          <path d="m3 18 1 1 2-2" />
        </svg>
        <span>All tasks</span>
      </button>

      <button
        type="button"
        className={`dockItem ${activeView === "categories" ? "isActive" : ""}`}
        aria-current={activeView === "categories" ? "page" : undefined}
        onClick={onNavigateCategories}
      >
        <svg className="dockIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
        <span>Categories</span>
      </button>

      <button type="button" className="dockItem dockCreateButton" onClick={onOpenNewQuest}>
        <svg className="dockIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        <span>Add task</span>
      </button>
    </nav>
  );
}
