"use client";

import { useEffect, useRef, useState } from "react";

type LiquidDockProps = {
  onNavigateHome: () => void;
};

export function LiquidDock({ onNavigateHome }: LiquidDockProps) {
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
        className="dockItem"
        aria-label="School"
        title="School"
        onClick={() => handlePlaceholderClick("School")}
      >
        <svg
          className="dockIcon"
          width="20"
          height="20"
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
      </button>

      {/* 2. Deliberately blank spacer position */}
      <div className="dockSpacer" aria-hidden="true" />

      {/* 3. Home icon in the center (visually emphasized center control) */}
      <button
        type="button"
        className="dockHomeButton"
        aria-label="Tasks (Home)"
        title="Tasks"
        aria-current="page"
        onClick={onNavigateHome}
      >
        <svg
          className="dockIcon dockHomeIcon"
          width="22"
          height="22"
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
        <span className="dockHomeIndicator" aria-hidden="true" />
      </button>

      {/* 4. Stats icon */}
      <button
        type="button"
        className="dockItem"
        aria-label="Stats"
        title="Stats"
        onClick={() => handlePlaceholderClick("Stats")}
      >
        <svg
          className="dockIcon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="20" x2="18" y2="4" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="12" y1="20" x2="12" y2="9" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="6" y1="20" x2="6" y2="14" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
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
          width="20"
          height="20"
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
