"use client";

import { useState } from "react";
import type { QuestForm } from "../types/quest";
import { useSheetSwipe } from "@/components/shared/use-sheet-swipe";

type QuestFormModalProps = {
  sheetOpen: boolean;
  form: QuestForm;
  setForm: React.Dispatch<React.SetStateAction<QuestForm>>;
  categories: string[];
  isCreating: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function QuestFormModal({
  sheetOpen,
  form,
  setForm,
  categories,
  isCreating,
  onClose,
  onSubmit,
}: QuestFormModalProps) {
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);

  const handleClose = () => {
    setIsCreatingNewCategory(false);
    onClose();
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
        aria-label="Close new quest form"
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
            <h2 id="sheet-title">New quest</h2>
          </div>
          <button className="closeButton" type="button" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
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

          <button className="saveButton" type="submit" disabled={isCreating}>
            {isCreating ? "Saving…" : "Create quest"}
          </button>
        </form>
      </section>
    </div>
  );
}
