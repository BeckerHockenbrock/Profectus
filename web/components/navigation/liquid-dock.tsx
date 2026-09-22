"use client";

export type AppTab = "tasks" | "school" | "focus";

type LiquidDockProps = {
  activeTab: AppTab;
  onNavigateTasks: () => void;
  onNavigateSchool: () => void;
  onNavigateFocus: () => void;
  onOpenNewQuest: () => void;
};

export function LiquidDock({
  activeTab,
  onNavigateTasks,
  onNavigateSchool,
  onNavigateFocus,
  onOpenNewQuest,
}: LiquidDockProps) {
  return (
    <nav className="liquidGlassDock" aria-label="Main navigation">
      {/* 1. Tasks */}
      <button
        type="button"
        className={`dockItem ${activeTab === "tasks" ? "isActive" : ""}`}
        aria-current={activeTab === "tasks" ? "page" : undefined}
        onClick={onNavigateTasks}
      >
        <svg
          className="dockIcon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <span>Tasks</span>
      </button>

      {/* 2. School */}
      <button
        type="button"
        className={`dockItem ${activeTab === "school" ? "isActive" : ""}`}
        aria-current={activeTab === "school" ? "page" : undefined}
        onClick={onNavigateSchool}
      >
        <svg
          className="dockIcon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
          <path d="M22 10v6" />
          <path d="M6 12.5V16c0 2.21 2.69 4 6 4s6-1.79 6-4v-3.5" />
        </svg>
        <span>School</span>
      </button>

      {/* 3. Lock In - Study timer */}
      <button
        type="button"
        className={`dockItem dockLockInItem ${activeTab === "focus" ? "isActive" : ""}`}
        aria-current={activeTab === "focus" ? "page" : undefined}
        onClick={onNavigateFocus}
        aria-label="Lock In study timer"
        title="Lock In study timer"
      >
        <svg
          className="dockIcon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
        <span>Lock In</span>
      </button>

      {/* 4. Add task button */}
      <button
        type="button"
        className="dockItem dockCreateButton"
        onClick={onOpenNewQuest}
        aria-label="Add task"
      >
        <svg
          className="dockIcon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        <span>Add task</span>
      </button>
    </nav>
  );
}
