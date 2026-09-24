"use client";

import { useEffect, useState } from "react";
import type { Quest, Subtask } from "../types/quest";
import { formatDueDateDetail, formatGoogleTaskDueDate } from "../domain/date-utils";
import { GoogleTasksDateBadge } from "./google-date-badge";
import { IosDatePickerPopover } from "./ios-date-picker";
import { useBodyScrollLock } from "@/components/shared/use-body-scroll-lock";
import { useSheetSwipe } from "@/components/shared/use-sheet-swipe";
import { useSubtaskReorder } from "../hooks/use-subtask-reorder";

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
  onReorderSubtasks?: (newSubtasks: Subtask[]) => void | Promise<boolean>;
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
  onReorderSubtasks,
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

  const {
    draggedSubtaskId,
    suppressClickRef: subtaskSuppressClickRef,
    handleSubtaskPointerDown,
    getSubtaskTransformY,
  } = useSubtaskReorder({
    subtasks,
    onReorder: onReorderSubtasks,
  });

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
          <div className="categoryPillGroup">
            <span className="categoryPill">
              <span className="categoryPillDot" aria-hidden="true" />
              <span>{quest.category}</span>
            </span>
          </div>

          <div className="detailHeaderActions">
            <button
              type="button"
              className="detailIconButton"
              onClick={onEdit}
              aria-label={`Edit ${quest.title}`}
              title="Edit quest"
              disabled={isUpdating}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
            <button
              type="button"
              className="detailCloseButton"
              onClick={onClose}
              aria-label="Close task details"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="detailModalBody">
          <div className="detailTitleSection">
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
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
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
                <span className="detailStatusPill isCompleted">
                  <span className="statusDot" aria-hidden="true" />
                  Completed
                </span>
              ) : (
                <span className="detailStatusPill inProgress">
                  <span className="statusDot" aria-hidden="true" />
                  In Progress
                </span>
              )}
            </div>
          </div>

          <div className="detailSection detailNotesSection">
            <div className="detailSectionHeader">
              <h3 className="detailSectionLabel">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>Notes & Description</span>
              </h3>
              {quest.description ? (
                <button
                  type="button"
                  className="detailSectionEditBtn"
                  onClick={onEdit}
                  title="Edit notes"
                  aria-label="Edit notes"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  <span>Edit</span>
                </button>
              ) : null}
            </div>
            {quest.description ? (
              <p className="detailDescription">{quest.description}</p>
            ) : (
              <button
                type="button"
                className="detailAddNotesPrompt"
                onClick={onEdit}
                aria-label="Add notes to quest"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add notes or details…</span>
              </button>
            )}
          </div>

          <div className="detailSection detailSubtasksSection">
            <div className="detailSubtasksHeader">
              <h3 className="detailSectionLabel">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>Subtasks</span>
              </h3>
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
                {openSubtasks.map((subtask) => {
                  const isDragging = draggedSubtaskId === subtask.id;
                  const transformY = getSubtaskTransformY(subtask.id);

                  return (
                    <li
                      key={subtask.id}
                      className="detailSubtaskItem"
                      data-subtask-id={subtask.id}
                      data-dragging={isDragging ? "true" : undefined}
                      style={{
                        transform: isDragging
                          ? `translateY(${transformY}px) scale(1.02)`
                          : transformY !== 0
                            ? `translateY(${transformY}px)`
                            : undefined,
                        zIndex: isDragging ? 50 : undefined,
                        transition: isDragging ? "none" : "transform 180ms cubic-bezier(0.2, 0.9, 0.3, 1)",
                      }}
                      onPointerDown={(e) => handleSubtaskPointerDown(e, subtask.id)}
                    >
                      <button
                        type="button"
                        className="subtaskCheckbox"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onToggleSubtask(subtask.id)}
                        aria-label={`Mark "${subtask.title}" as complete`}
                        aria-pressed={false}
                      >
                        <span className="subtaskCheckIcon" aria-hidden="true" />
                      </button>

                      <div className="subtaskTitleGroup">
                        <span
                          className="subtaskTitle"
                          onClick={() => {
                            if (subtaskSuppressClickRef.current) return;
                            onToggleSubtask(subtask.id);
                          }}
                        >
                          {subtask.title}
                        </span>
                        <button
                          type="button"
                          className="subtaskDateLabelBtn"
                          title={subtask.dueDate ? `Due ${subtask.dueDate} (click to change)` : "Set subtask due date"}
                          onPointerDown={(e) => e.stopPropagation()}
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
                        onPointerDown={(e) => e.stopPropagation()}
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
                  );
                })}
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
                    width="12"
                    height="12"
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
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
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
              <div className="detailAddSubtaskCapsule">
                <div className="detailAddSubtaskLeadingIcon" aria-hidden="true">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="detailAddSubtaskInput"
                  placeholder="Add a subtask…"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  maxLength={160}
                />
                <div className="detailAddSubtaskTrailing">
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
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                    title="Add subtask"
                    aria-label="Add subtask"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="detailFocusCard">
            <div className="detailFocusInfo">
              <span className="detailFocusLabel">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Focus Progress</span>
              </span>
              <div className="detailFocusStatsRow">
                <span className="detailFocusMinutes">
                  <strong>{quest.focusMinutes}</strong> min focused
                </span>
                <span className="detailFocusDivider">·</span>
                <span className="detailFocusXp">
                  <svg className="detailFocusXpIcon" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <strong>{quest.focusMinutes}</strong> XP
                </span>
              </div>
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
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 3 20 12 6 21 6 3" />
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
            {quest.completed ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                <span>Reopen Quest</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Mark Completed</span>
              </>
            )}
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
