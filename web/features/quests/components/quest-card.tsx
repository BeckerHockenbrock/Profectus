"use client";

import type React from "react";
import type { Quest } from "../types/quest";
import { GoogleTasksDateBadge } from "./google-date-badge";

type QuestCardProps = {
  quest: Quest;
  today: string;
  onToggle: (id: string) => void;
  onSelect: (quest: Quest) => void;
  isUpdating: boolean;
  isDragging?: boolean;
  transformY?: number;
  onPointerDown?: (event: React.PointerEvent, questId: string, isHandle?: boolean) => void;
  onToggleSubtask?: (questId: string, subtaskId: string) => void;
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
  onToggleSubtask,
}: QuestCardProps) {
  const subtasks = quest.subtasks ?? [];

  return (
    <article
      className={`questCard${quest.completed ? " isComplete" : ""}${
        subtasks.length > 0 ? " hasSubtasks" : ""
      }`}
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
      <div className="questCardHeader">
        <button
          className="completeButton"
          type="button"
          aria-label={quest.completed ? `Mark ${quest.title} as incomplete` : `Mark ${quest.title} as completed`}
          aria-pressed={quest.completed}
          onPointerDown={(event) => event.stopPropagation()}
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
            {quest.dueDate ? (
              <GoogleTasksDateBadge
                dueDate={quest.dueDate}
                today={today}
                completed={quest.completed}
              />
            ) : null}
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
      </div>

      {subtasks.length > 0 ? (
        <div className="questSubtasksContainer" role="list">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className={`googleSubtaskItem${subtask.completed ? " isComplete" : ""}`}
              role="listitem"
            >
              <button
                type="button"
                className={`googleSubtaskCheckbox${subtask.completed ? " isChecked" : ""}`}
                aria-label={
                  subtask.completed
                    ? `Mark subtask "${subtask.title}" as incomplete`
                    : `Mark subtask "${subtask.title}" as completed`
                }
                aria-pressed={subtask.completed}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleSubtask?.(quest.id, subtask.id);
                }}
              >
                <span className="googleSubtaskCheckMark" aria-hidden="true">
                  {subtask.completed ? "✓" : ""}
                </span>
              </button>

              <div className="googleSubtaskContent">
                <span className="googleSubtaskTitle">{subtask.title}</span>
                {subtask.dueDate ? (
                  <GoogleTasksDateBadge
                    dueDate={subtask.dueDate}
                    today={today}
                    completed={subtask.completed}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
