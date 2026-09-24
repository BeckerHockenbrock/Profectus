"use client";

import { useState } from "react";
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
  onPointerDown?: (event: React.PointerEvent, questId: string) => void;
  onToggleSubtask?: (questId: string, subtaskId: string) => void;
  onOpenDatePicker?: (questId: string, currentDate: string, anchorRect: DOMRect) => void;
  onOpenSubtaskDatePicker?: (questId: string, subtaskId: string, currentDate: string, anchorRect: DOMRect) => void;
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
  onOpenDatePicker,
  onOpenSubtaskDatePicker,
}: QuestCardProps) {
  const [showCompletedSubtasks, setShowCompletedSubtasks] = useState(false);
  const subtasks = quest.subtasks ?? [];
  const openSubtasks = subtasks.filter((s) => !s.completed);
  const completedSubtasks = subtasks.filter((s) => s.completed);

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
      onPointerDown={(event) => onPointerDown?.(event, quest.id)}
      onClick={() => onSelect(quest)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(quest);
        }
      }}
      aria-label={`${quest.title}, ${quest.completed ? "completed" : "incomplete"}. Press and hold to reorder, or click to view details`}
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
          {quest.description?.trim() ? (
            <p className="questNotesSnippet">{quest.description.trim()}</p>
          ) : null}
          <div className="questMeta">
            {quest.dueDate ? (
              <GoogleTasksDateBadge
                dueDate={quest.dueDate}
                today={today}
                completed={quest.completed}
                onClick={
                  onOpenDatePicker
                    ? (event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        onOpenDatePicker(quest.id, quest.dueDate, rect);
                      }
                    : undefined
                }
              />
            ) : null}
            <span className="categoryPill">{quest.category}</span>
            {quest.focusMinutes > 0 ? (
              <span className="questXPBadge">{quest.focusMinutes}m</span>
            ) : null}
          </div>
        </div>

        <div className="questCardActionsRow">
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
          {openSubtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="googleSubtaskItem"
              role="listitem"
            >
              <button
                type="button"
                className="googleSubtaskCheckbox"
                aria-label={`Mark subtask "${subtask.title}" as completed`}
                aria-pressed={false}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleSubtask?.(quest.id, subtask.id);
                }}
              >
                <span className="googleSubtaskCheckMark" aria-hidden="true" />
              </button>

              <div className="googleSubtaskContent">
                <span className="googleSubtaskTitle">{subtask.title}</span>
                {subtask.dueDate ? (
                  <GoogleTasksDateBadge
                    dueDate={subtask.dueDate}
                    today={today}
                    completed={false}
                    onClick={
                      onOpenSubtaskDatePicker
                        ? (event) => {
                            const rect = event.currentTarget.getBoundingClientRect();
                            onOpenSubtaskDatePicker(quest.id, subtask.id, subtask.dueDate ?? "", rect);
                          }
                        : undefined
                    }
                  />
                ) : null}
              </div>
            </div>
          ))}

          {completedSubtasks.length > 0 ? (
            <div className="subtasksCompletedSection">
              <button
                type="button"
                className="subtasksCompletedToggle"
                aria-expanded={showCompletedSubtasks}
                aria-label={`${showCompletedSubtasks ? "Hide" : "Show"} completed subtasks (${completedSubtasks.length})`}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowCompletedSubtasks((previous) => !previous);
                }}
              >
                <svg
                  className={`subtasksCompletedChevron ${showCompletedSubtasks ? "isOpen" : ""}`}
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 6 15 12 9 18" />
                </svg>
                <span>Completed ({completedSubtasks.length})</span>
              </button>

              {showCompletedSubtasks ? (
                <div className="subtasksCompletedList">
                  {completedSubtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="googleSubtaskItem isComplete"
                      role="listitem"
                    >
                      <button
                        type="button"
                        className="googleSubtaskCheckbox isChecked"
                        aria-label={`Mark subtask "${subtask.title}" as incomplete`}
                        aria-pressed={true}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleSubtask?.(quest.id, subtask.id);
                        }}
                      >
                        <span className="googleSubtaskCheckMark" aria-hidden="true">
                          ✓
                        </span>
                      </button>

                      <div className="googleSubtaskContent">
                        <span className="googleSubtaskTitle">{subtask.title}</span>
                        {subtask.dueDate ? (
                          <GoogleTasksDateBadge
                            dueDate={subtask.dueDate}
                            today={today}
                            completed={true}
                            onClick={
                              onOpenSubtaskDatePicker
                                ? (event) => {
                                    const rect = event.currentTarget.getBoundingClientRect();
                                    onOpenSubtaskDatePicker(quest.id, subtask.id, subtask.dueDate ?? "", rect);
                                  }
                                : undefined
                            }
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
