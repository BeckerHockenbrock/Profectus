"use client";

export type AppTab = "brief" | "tasks" | "account";

type LiquidDockProps = {
  activeTab: AppTab;
  onNavigateBrief: () => void;
  onNavigateTasks: () => void;
  onNavigateAccount: () => void;
};

export function LiquidDock({
  activeTab,
  onNavigateBrief,
  onNavigateTasks,
  onNavigateAccount,
}: LiquidDockProps) {
  return (
    <nav className="liquidGlassDock" aria-label="Main navigation">
      <button
        type="button"
        className={`dockItem ${activeTab === "brief" ? "isActive" : ""}`}
        aria-current={activeTab === "brief" ? "page" : undefined}
        onClick={onNavigateBrief}
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
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 7h8" />
          <path d="M8 11h6" />
        </svg>
        <span className="dockOrdinal" aria-hidden="true">
          01
        </span>
        <span>Brief</span>
      </button>

      <button
        type="button"
        className={`dockItem dockHomeItem ${activeTab === "tasks" ? "isActive" : ""}`}
        aria-current={activeTab === "tasks" ? "page" : undefined}
        onClick={onNavigateTasks}
        aria-label="Quests home"
        title="Quests"
      >
        <svg
          className="dockIcon dockHomeIcon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9 21v-7h6v7" />
        </svg>
        <span className="dockOrdinal" aria-hidden="true">
          02
        </span>
        <span>Quests</span>
      </button>

      <button
        type="button"
        className={`dockItem ${activeTab === "account" ? "isActive" : ""}`}
        aria-current={activeTab === "account" ? "page" : undefined}
        onClick={onNavigateAccount}
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
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </svg>
        <span className="dockOrdinal" aria-hidden="true">
          03
        </span>
        <span>Account</span>
      </button>
    </nav>
  );
}
