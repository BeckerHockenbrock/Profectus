"use client";

import { useState } from "react";
import type { QuestForm, Subtask } from "../types/quest";
import { getLocalTodayString } from "../domain/date-utils";
import { GoogleTasksDateBadge } from "./google-date-badge";
import { useBodyScrollLock } from "@/components/shared/use-body-scroll-lock";
import { useSheetSwipe } from "@/components/shared/use-sheet-swipe";

type QuestFormModalProps = {
  sheetOpen: boolean;
  editingQuestId: string | null;
  form: QuestForm;
  setForm: React.Dispatch<React.SetStateAction<QuestForm>>;
  categories: string[];
  isSaving: boolean;
  formError: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function QuestFormModal({
  sheetOpen,
  editingQuestId,
  form,
  setForm,
  categories,
  isSaving,
  formError,
  onClose,
  onSubmit,
}: QuestFormModalProps) {
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newSubtaskInput, setNewSubtaskInput] = useState("");
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState("");
  useBodyScrollLock(sheetOpen);

  const today = getLocalTodayString();

  const handleClose = () => {
    setIsCreatingNewCategory(false);
    setNewSubtaskInput("");
    setNewSubtaskDueDate("");
    onClose();
  };

  const handleAddSubtaskToForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = newSubtaskInput.trim();
    if (!title) return;

    const newSubtask: Subtask = {
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      completed: false,
      ...(newSubtaskDueDate ? { dueDate: newSubtaskDueDate } : {}),
    };

    setForm((prev) => ({
      ...prev,
      subtasks: [...(prev.subtasks ?? []), newSubtask],
    }));
    setNewSubtaskInput("");
    setNewSubtaskDueDate("");
  };

  const handleRemoveSubtaskFromForm = (subtaskId: string) => {
    setForm((prev) => ({
      ...prev,
      subtasks: (prev.subtasks ?? []).filter((st) => st.id !== subtaskId),
    }));
  };

  const {
    sheetRef,
    scrimRef,
    dragHandleProps,
  } = useSheetSwipe({ onClose: handleClose });

  return (
    <div
      className="sheetLayer"
      data-open={sheetOpen}
      aria-hidden={!sheetOpen}
      {...(!sheetOpen ? { inert: true } : {})}
      onKeyDown={(event) => {
        if (event.key === "Escape") handleClose();
      }}
    >
      <button
        ref={scrimRef as React.RefObject<HTMLButtonElement>}
        className="sheetScrim"
        type="button"
        aria-label="Close quest form"
        onClick={handleClose}
      />
      <section
        ref={sheetRef as React.RefObject<HTMLElement>}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        <div className="sheetHandleArea" {...dragHandleProps}>
          <div className="sheetHandle" aria-hidden="true" />
        </div>
        <div className="sheetHeading" {...dragHandleProps}>
          <div>
            <h2 id="sheet-title">{editingQuestId ? "Edit quest" : "New quest"}</h2>
          </div>
          <button className="closeButton" type="button" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {formError ? <p className="formError" role="alert">{formError}</p> : null}

          <label>
            Quest title
            <input
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="What needs to move forward?"
            />
          </label>

          <label>
            Category
            {isCreatingNewCategory ? (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  required
                  autoFocus
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  placeholder="New category name…"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="categoryBackButton"
                  onClick={() => {
                    setIsCreatingNewCategory(false);
                    setForm({ ...form, category: "General" });
                  }}
                  aria-label="Cancel new category"
                  style={{
                    minHeight: "3rem",
                    padding: "0 0.75rem",
                    border: "1px solid var(--line)",
                    borderRadius: "0.9rem",
                    background: "rgba(255, 255, 255, 0.055)",
                    color: "var(--secondary)",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <select
                required
                value={form.category || ""}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "__new__") {
                    setIsCreatingNewCategory(true);
                    setForm({ ...form, category: "" });
                  } else {
                    setForm({ ...form, category: value });
                  }
                }}
              >
                <option value="" disabled>
                  Select a category…
                </option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value="__new__">＋ Create new category…</option>
              </select>
            )}
          </label>

          <div className="formSubtasksGroup">
            <div className="formSubtasksHeader">
              <span className="formSubtasksLabel">Subtasks</span>
              <span className="formOptionalBadge">Optional</span>
            </div>

            {form.subtasks && form.subtasks.length > 0 ? (
              <ul className="formSubtaskList" role="list">
                {form.subtasks.map((subtask) => (
                  <li key={subtask.id} className="formSubtaskItem">
                    <div className="formSubtaskItemLeft">
                      <span className="formSubtaskBullet" aria-hidden="true">•</span>
                      <span className="formSubtaskTitle">{subtask.title}</span>
                      <label
                        className="subtaskDateLabel"
                        title={subtask.dueDate ? `Due ${subtask.dueDate} (click to change)` : "Set subtask due date"}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          position: "relative",
                          cursor: "pointer",
                          marginInlineStart: "0.25rem",
                          flexShrink: 0,
                        }}
                      >
                        {subtask.dueDate ? (
                          <GoogleTasksDateBadge dueDate={subtask.dueDate} today={today} />
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "0.45rem",
                              fontSize: "0.72rem",
                              fontWeight: 500,
                              color: "var(--muted)",
                              border: "1px dashed rgba(255, 255, 255, 0.16)",
                              background: "rgba(255, 255, 255, 0.03)",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>+ Date</span>
                          </span>
                        )}
                        <input
                          type="date"
                          value={subtask.dueDate ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm((prev) => ({
                              ...prev,
                              subtasks: (prev.subtasks ?? []).map((st) =>
                                st.id === subtask.id ? { ...st, dueDate: val || undefined } : st
                              ),
                            }));
                          }}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            opacity: 0,
                            cursor: "pointer",
                          }}
                          aria-label={`Due date for ${subtask.title}`}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="formSubtaskRemoveButton"
                      onClick={() => handleRemoveSubtaskFromForm(subtask.id)}
                      aria-label={`Remove subtask "${subtask.title}"`}
                      title="Remove subtask"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="formAddSubtaskRow">
              <input
                type="text"
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtaskToForm();
                  }
                }}
                placeholder="Add a subtask…"
                maxLength={160}
              />
              <input
                type="date"
                className="formSubtaskDateInput"
                value={newSubtaskDueDate}
                onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                title="Subtask due date (optional)"
                aria-label="Subtask due date"
              />
              <button
                type="button"
                className="formAddSubtaskButton"
                onClick={() => handleAddSubtaskToForm()}
                disabled={!newSubtaskInput.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <label>
            Description <span>Optional</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="A clear next step or a useful note"
            />
          </label>

          <label>
            Due date <span>Optional</span>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
          </label>

          <button className="saveButton" type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : editingQuestId ? "Save changes" : "Create quest"}
          </button>
        </form>
      </section>
    </div>
  );
}
