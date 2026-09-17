"use client";

import { useEffect, useRef, useState } from "react";

type LiquidDockProps = {
  activeTab?: "tasks" | "school" | "journal" | "stats";
  onNavigateHome: () => void;
  onNavigateSchool?: () => void;
  onNavigateJournal?: () => void;
  onNavigateStats?: () => void;
};

export function LiquidDock({
  activeTab = "tasks",
  onNavigateHome,
  onNavigateSchool,
  onNavigateJournal,
  onNavigateStats,
}: LiquidDockProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handlePlaceholderClick(name: string) {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(`${name} · Coming soon`);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  }

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="liquidGlassDock" aria-label="Main Navigation">
      {toastMessage ? (
        <div className="dockToast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}

      {/* 1. School icon */}
      <button
        type="button"
        className={`dockItem ${activeTab === "school" ? "isActive" : ""}`}
        aria-label="School"
        title="School Schedule"
        aria-current={activeTab === "school" ? "page" : undefined}
        onClick={() => {
          if (onNavigateSchool) {
            onNavigateSchool();
          } else {
            handlePlaceholderClick("School");
          }
        }}
      >
        <svg
          className="dockIcon"
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
          <path d="M22 10v6" />
          <path d="M6 12.5V16c0 2.21 2.69 4 6 4s6-1.79 6-4v-3.5" />
        </svg>
        {activeTab === "school" ? (
          <span className="dockItemIndicator" aria-hidden="true" />
        ) : null}
      </button>

      {/* 2. Journal icon */}
      <button
        type="button"
        className={`dockItem ${activeTab === "journal" ? "isActive" : ""}`}
        aria-label="Journal"
        title="Journal"
        aria-current={activeTab === "journal" ? "page" : undefined}
        onClick={() => {
          if (onNavigateJournal) {
            onNavigateJournal();
          } else {
            handlePlaceholderClick("Journal");
          }
        }}
      >
        <svg
          className="dockIcon"
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5l7 7 3-3-7-7-3 3z" />
          <path d="M18 11l-1.5 7.5L2 22l3.5-14.5L13 6l5 5z" />
          <path d="M2 22l7.586-7.586" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
        {activeTab === "journal" ? (
          <span className="dockItemIndicator" aria-hidden="true" />
        ) : null}
      </button>

      {/* 3. Home icon in the center (visually emphasized center control) */}
      <button
        type="button"
        className={`dockHomeButton ${activeTab === "tasks" ? "isActive" : ""}`}
        aria-label="Tasks (Home)"
        title="Tasks"
        aria-current={activeTab === "tasks" ? "page" : undefined}
        onClick={onNavigateHome}
      >
        <svg
          className="dockIcon dockHomeIcon"
          width="25"
          height="25"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 10.5 12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
        </svg>
        {activeTab === "tasks" ? (
          <span className="dockHomeIndicator" aria-hidden="true" />
        ) : null}
      </button>

      {/* 4. Stats icon */}
      <button
        type="button"
        className={`dockItem ${activeTab === "stats" ? "isActive" : ""}`}
        aria-label="Stats"
        title="Progress & Stats"
        aria-current={activeTab === "stats" ? "page" : undefined}
        onClick={() => {
          if (onNavigateStats) {
            onNavigateStats();
          } else {
            handlePlaceholderClick("Stats");
          }
        }}
      >
        <svg
          className="dockIcon"
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
        {activeTab === "stats" ? (
          <span className="dockItemIndicator" aria-hidden="true" />
        ) : null}
      </button>

      {/* 5. Health icon */}
      <button
        type="button"
        className="dockItem"
        aria-label="Health"
        title="Health"
        onClick={() => handlePlaceholderClick("Health")}
      >
        <svg
          className="dockIcon"
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      </button>
    </nav>
  );
}
