"use client";

import { useEffect, useState } from "react";
import type { Quest, Subtask } from "../types/quest";
import { formatDueDateDetail, formatGoogleTaskDueDate } from "../domain/date-utils";
import { GoogleTasksDateBadge } from "./google-date-badge";
import { IosDatePickerPopover } from "./ios-date-picker";
import { useBodyScrollLock } from "@/components/shared/use-body-scroll-lock";
import { useSheetSwipe } from "@/components/shared/use-sheet-swipe";

type TaskDetailModalProps = {
  quest: Quest;
  today: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
  onToggleComplete: (id: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onUpdateSubtask?: (subtaskId: string, updates: Partial<Subtask>) => void | Promise<boolean>;
  onAddSubtask: (title: string, dueDate?: string) => void | Promise<boolean>;
  onDeleteSubtask: (subtaskId: string) => void | Promise<boolean>;
  onStartFocus: (quest: Quest) => void;
  onUpdateDueDate?: (dueDate: string) => void | Promise<boolean>;
  isUpdating: boolean;
};

export function TaskDetailModal({
  quest,
  today,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
  onToggleSubtask,
  onUpdateSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onStartFocus,
  onUpdateDueDate,
  isUpdating,
}: TaskDetailModalProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState("");
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<{
    type: "quest" | "subtask" | "newSubtask";
    subtaskId?: string;
    currentDate: string;
    anchorRect: DOMRect;
  } | null>(null);
  const { sheetRef, scrimRef, dragHandleProps } = useSheetSwipe({ onClose });
  useBodyScrollLock(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newSubtaskTitle.trim();
    if (!title || isSubmittingSubtask) return;

    setIsSubmittingSubtask(true);
    try {
      await onAddSubtask(title, newSubtaskDueDate || undefined);
      setNewSubtaskTitle("");
      setNewSubtaskDueDate("");
    } finally {
      setIsSubmittingSubtask(false);
    }
  };

  const handleSelectDate = (newDate: string) => {
    if (!datePickerTarget) return;
    if (datePickerTarget.type === "quest") {
      onUpdateDueDate?.(newDate);
    } else if (datePickerTarget.type === "subtask" && datePickerTarget.subtaskId) {
      onUpdateSubtask?.(datePickerTarget.subtaskId, { dueDate: newDate || undefined });
    } else if (datePickerTarget.type === "newSubtask") {
      setNewSubtaskDueDate(newDate);
    }
  };

  const isDueToday = quest.dueDate === today;
  const subtasks = quest.subtasks ?? [];
  const openSubtasks = subtasks.filter((s) => !s.completed);
  const completedSubtasks = subtasks.filter((s) => s.completed);
  const [showCompletedSubtasks, setShowCompletedSubtasks] = useState(false);
  const completedSubtasksCount = completedSubtasks.length;
  const totalSubtasksCount = subtasks.length;
  const progressPercent =
    totalSubtasksCount > 0
      ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100)
      : 0;

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
          <div className="detailHeaderLeft">
            <button
              type="button"
              className="detailIconButton"
              onClick={onEdit}
              aria-label={`Edit ${quest.title}`}
              title="Edit quest"
              disabled={isUpdating}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
            <button
              type="button"
              className="detailIconButton isDestructive"
              onClick={onDelete}
              aria-label={`Delete ${quest.title}`}
              title="Delete quest"
              disabled={isUpdating}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
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
            <button
              type="button"
              className={`dueLabel isClickable${isDueToday ? " isToday" : ""}`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setDatePickerTarget({
                  type: "quest",
                  currentDate: quest.dueDate,
                  anchorRect: rect,
                });
              }}
              title={quest.dueDate ? `Due ${quest.dueDate} (click to change)` : "Set due date"}
              aria-label={`Due date: ${formatDueDateDetail(quest.dueDate, today, quest.completed)}. Click to change`}
            >
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
              <span>{formatDueDateDetail(quest.dueDate, today, quest.completed)}</span>
            </button>

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

          <div className="detailSection detailSubtasksSection">
            <div className="detailSubtasksHeader">
              <h3 className="detailSectionLabel">Subtasks</h3>
              {totalSubtasksCount > 0 ? (
                <span className="subtasksProgressText">
                  {completedSubtasksCount} of {totalSubtasksCount} completed ({progressPercent}%)
                </span>
              ) : null}
            </div>

            {totalSubtasksCount > 0 ? (
              <div
                className="subtaskProgressBar"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Subtasks completion progress"
              >
                <div
                  className="subtaskProgressFill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            ) : null}

            {openSubtasks.length > 0 ? (
              <ul className="detailSubtaskList" role="list">
                {openSubtasks.map((subtask) => (
                  <li key={subtask.id} className="detailSubtaskItem">
                    <button
                      type="button"
                      className="subtaskCheckbox"
                      onClick={() => onToggleSubtask(subtask.id)}
                      aria-label={`Mark "${subtask.title}" as complete`}
                      aria-pressed={false}
                    >
                      <span className="subtaskCheckIcon" aria-hidden="true" />
                    </button>

                    <div className="subtaskTitleGroup">
                      <span
                        className="subtaskTitle"
                        onClick={() => onToggleSubtask(subtask.id)}
                      >
                        {subtask.title}
                      </span>
                      <button
                        type="button"
                        className="subtaskDateLabelBtn"
                        title={subtask.dueDate ? `Due ${subtask.dueDate} (click to change)` : "Set subtask due date"}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDatePickerTarget({
                            type: "subtask",
                            subtaskId: subtask.id,
                            currentDate: subtask.dueDate ?? "",
                            anchorRect: rect,
                          });
                        }}
                      >
                        {subtask.dueDate ? (
                          <GoogleTasksDateBadge
                            dueDate={subtask.dueDate}
                            today={today}
                            completed={false}
                          />
                        ) : (
                          <span className="subtaskDatePlaceholder">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>+ Date</span>
                          </span>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      className="subtaskDeleteButton"
                      onClick={() => onDeleteSubtask(subtask.id)}
                      aria-label={`Delete subtask "${subtask.title}"`}
                      title="Delete subtask"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {completedSubtasks.length > 0 ? (
              <div className="detailCompletedSubtasksSection">
                <button
                  type="button"
                  className="detailCompletedSubtasksToggle"
                  onClick={() => setShowCompletedSubtasks((previous) => !previous)}
                  aria-expanded={showCompletedSubtasks}
                  aria-label={`${showCompletedSubtasks ? "Hide" : "Show"} completed subtasks (${completedSubtasks.length})`}
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
                  <ul className="detailSubtaskList detailCompletedSubtaskList" role="list">
                    {completedSubtasks.map((subtask) => (
                      <li key={subtask.id} className="detailSubtaskItem isComplete">
                        <button
                          type="button"
                          className="subtaskCheckbox isChecked"
                          onClick={() => onToggleSubtask(subtask.id)}
                          aria-label={`Mark "${subtask.title}" as incomplete`}
                          aria-pressed={true}
                        >
                          <span className="subtaskCheckIcon" aria-hidden="true">
                            ✓
                          </span>
                        </button>

                        <div className="subtaskTitleGroup">
                          <span
                            className="subtaskTitle"
                            onClick={() => onToggleSubtask(subtask.id)}
                          >
                            {subtask.title}
                          </span>
                          <button
                            type="button"
                            className="subtaskDateLabelBtn"
                            title={subtask.dueDate ? `Due ${subtask.dueDate} (click to change)` : "Set subtask due date"}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDatePickerTarget({
                                type: "subtask",
                                subtaskId: subtask.id,
                                currentDate: subtask.dueDate ?? "",
                                anchorRect: rect,
                              });
                            }}
                          >
                            {subtask.dueDate ? (
                              <GoogleTasksDateBadge
                                dueDate={subtask.dueDate}
                                today={today}
                                completed={true}
                              />
                            ) : (
                              <span className="subtaskDatePlaceholder">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>+ Date</span>
                              </span>
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          className="subtaskDeleteButton"
                          onClick={() => onDeleteSubtask(subtask.id)}
                          aria-label={`Delete subtask "${subtask.title}"`}
                          title="Delete subtask"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <form className="detailAddSubtaskForm" onSubmit={handleAddSubtask}>
              <input
                type="text"
                className="detailAddSubtaskInput"
                placeholder="Add a subtask…"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                maxLength={160}
              />
              <button
                type="button"
                className={`detailAddSubtaskDateBtn${newSubtaskDueDate ? " hasDate" : ""}`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDatePickerTarget({
                    type: "newSubtask",
                    currentDate: newSubtaskDueDate,
                    anchorRect: rect,
                  });
                }}
                title="Subtask due date (optional)"
                aria-label="Subtask due date"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{newSubtaskDueDate ? formatGoogleTaskDueDate(newSubtaskDueDate, today) : "+ Date"}</span>
              </button>
              <button
                type="submit"
                className="detailAddSubtaskButton"
                disabled={!newSubtaskTitle.trim() || isSubmittingSubtask}
              >
                Add
              </button>
            </form>
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

      {datePickerTarget ? (
        <IosDatePickerPopover
          isOpen={Boolean(datePickerTarget)}
          currentDate={datePickerTarget.currentDate}
          today={today}
          anchorRect={datePickerTarget.anchorRect}
          onSelectDate={handleSelectDate}
          onClose={() => setDatePickerTarget(null)}
          title={
            datePickerTarget.type === "quest"
              ? "Quest Due Date"
              : datePickerTarget.type === "subtask"
                ? "Subtask Due Date"
                : "Add Subtask Date"
          }
        />
      ) : null}
    </div>
  );
}
