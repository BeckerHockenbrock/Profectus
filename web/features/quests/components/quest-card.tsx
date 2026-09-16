"use client";

import type React from "react";
import type { Quest } from "../types/quest";
import { formatDueDate } from "../domain/date-utils";

type QuestCardProps = {
  quest: Quest;
  today: string;
  onToggle: (id: string) => void;
  onSelect: (quest: Quest) => void;
  isUpdating: boolean;
  isDragging?: boolean;
  transformY?: number;
  onPointerDown?: (event: React.PointerEvent, questId: string, isHandle?: boolean) => void;
};

export function QuestCard({
  quest,
  today,
  onToggle,
  onSelect,
  isUpdating,
  isDragging,
  transformY,
  onPointerDown,
}: QuestCardProps) {
  return (
    <article
      className={`questCard${quest.completed ? " isComplete" : ""}`}
      data-quest-id={quest.id}
      data-dragging={isDragging ? "true" : undefined}
      style={{
        transform: isDragging
          ? `translateY(${transformY ?? 0}px) scale(1.025)`
          : transformY && transformY !== 0
            ? `translateY(${transformY}px)`
            : undefined,
        zIndex: isDragging ? 80 : undefined,
        transition: isDragging ? "none" : "transform 180ms cubic-bezier(0.2, 0.9, 0.3, 1)",
      }}
      role="button"
      tabIndex={0}
      onPointerDown={(event) => onPointerDown?.(event, quest.id, false)}
      onClick={() => onSelect(quest)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(quest);
        }
      }}
      aria-label={`${quest.title}, ${quest.completed ? "completed" : "incomplete"}. Hold or drag grip to reorder, or click to view details`}
    >
      <button
        className="completeButton"
        type="button"
        aria-label={quest.completed ? `Mark ${quest.title} as incomplete` : `Mark ${quest.title} as completed`}
        aria-pressed={quest.completed}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(quest.id);
        }}
        disabled={isUpdating}
      >
        <span className="checkIcon" aria-hidden="true">
          {quest.completed ? "✓" : ""}
        </span>
      </button>

      <div className="questContent">
        <h3 className="questTitle">{quest.title}</h3>
        <div className="questMeta">
          <span className={quest.dueDate === today ? "dueLabel isToday" : "dueLabel"}>
            <svg
              className="dueCalendarIcon"
              width="11"
              height="11"
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
            <span>{formatDueDate(quest.dueDate, today)}</span>
          </span>
          <span className="categoryPill">{quest.category}</span>
          {quest.focusMinutes > 0 ? (
            <span className="questXPBadge">{quest.focusMinutes}m</span>
          ) : null}
        </div>
      </div>

      <div className="questCardActionsRow">
        {onPointerDown ? (
          <span
            className="dragGripHandle"
            aria-label="Drag to reorder"
            title="Drag to reorder"
            onPointerDown={(event) => {
              event.stopPropagation();
              onPointerDown?.(event, quest.id, true);
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="9" cy="5" r="1.75" />
              <circle cx="15" cy="5" r="1.75" />
              <circle cx="9" cy="12" r="1.75" />
              <circle cx="15" cy="12" r="1.75" />
              <circle cx="9" cy="19" r="1.75" />
              <circle cx="15" cy="19" r="1.75" />
            </svg>
          </span>
        ) : null}
        <span className="questCardChevron" aria-hidden="true">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </article>
  );
}
