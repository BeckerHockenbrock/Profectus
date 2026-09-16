"use client";

import { useEffect } from "react";
import type { Quest } from "@/lib/quest-types";
import { useSheetSwipe } from "./use-sheet-swipe";

type TaskDetailModalProps = {
  quest: Quest;
  today: string;
  onClose: () => void;
  onToggleComplete: (id: string) => void;
  onStartFocus: (quest: Quest) => void;
  isUpdating: boolean;
};

function addDays(isoDate: string, daysToAdd: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day + daysToAdd);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function formatDueDateDetail(dueDate: string, today: string) {
  if (!dueDate) return "No due date";
  if (dueDate === today) return "Due today";
  if (dueDate === addDays(today, 1)) return "Due tomorrow";

  const [year, month, day] = dueDate.split("-");
  const currentYear = today.slice(0, 4);
  const formatted = year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;
  return `Due ${formatted}`;
}

export function TaskDetailModal({
  quest,
  today,
  onClose,
  onToggleComplete,
  onStartFocus,
  isUpdating,
}: TaskDetailModalProps) {
  const { sheetRef, scrimRef, dragHandleProps } = useSheetSwipe({ onClose });

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const isDueToday = quest.dueDate === today;

  return (
    <div
      ref={scrimRef as React.RefObject<HTMLDivElement>}
      className="detailModalScrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={sheetRef as React.RefObject<HTMLElement>}
        className="detailModalSheet"
      >
        <div className="sheetHandleArea" {...dragHandleProps}>
          <div className="sheetHandle" aria-hidden="true" />
        </div>

        <header className="detailModalHeader" {...dragHandleProps}>
          <span className="categoryPill">{quest.category}</span>
          <button
            type="button"
            className="detailCloseButton"
            onClick={onClose}
            aria-label="Close task details"
          >
            ×
          </button>
        </header>

        <div className="detailModalBody">
          <h2 id="task-detail-title" className={`detailTitle${quest.completed ? " isComplete" : ""}`}>
            {quest.title}
          </h2>

          <div className="detailMetaRow">
            <span className={`dueLabel${isDueToday ? " isToday" : ""}`}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{formatDueDateDetail(quest.dueDate, today)}</span>
            </span>

            {quest.completed ? (
              <span className="detailStatusPill isCompleted">Completed</span>
            ) : (
              <span className="detailStatusPill inProgress">In Progress</span>
            )}
          </div>

          <div className="detailSection">
            <h3 className="detailSectionLabel">Notes & Description</h3>
            {quest.description ? (
              <p className="detailDescription">{quest.description}</p>
            ) : (
              <p className="detailDescription isEmpty">No additional notes added for this quest.</p>
            )}
          </div>

          <div className="detailFocusCard">
            <div className="detailFocusInfo">
              <span className="detailFocusLabel">Focus Progress</span>
              <strong className="detailFocusStats">
                {quest.focusMinutes} min focused · {quest.focusMinutes} XP
              </strong>
            </div>

            <button
              type="button"
              className="detailStartFocusButton"
              onClick={() => {
                onClose();
                onStartFocus(quest);
              }}
              aria-label={`Start focus mode on ${quest.title}`}
            >
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Start Focus Mode</span>
            </button>
          </div>
        </div>

        <footer className="detailModalFooter">
          <button
            type="button"
            className={`detailCompleteToggle${quest.completed ? " isReopen" : ""}`}
            onClick={() => onToggleComplete(quest.id)}
            disabled={isUpdating}
          >
            {quest.completed ? "Reopen Quest" : "Mark Completed"}
          </button>
        </footer>
      </section>
    </div>
  );
}
