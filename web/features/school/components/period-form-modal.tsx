"use client";

import type React from "react";
import { useBodyScrollLock } from "@/components/shared/use-body-scroll-lock";
import { useSheetSwipe } from "@/components/shared/use-sheet-swipe";
import type { DayOfWeek, PeriodFormData } from "../types/school";
import { ALL_DAYS, PERIOD_ICONS } from "../types/school";
import { PeriodIcon } from "./period-icon";

type PeriodFormModalProps = {
  sheetOpen: boolean;
  editingPeriodId: string | null;
  form: PeriodFormData;
  setForm: React.Dispatch<React.SetStateAction<PeriodFormData>>;
  formError: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onToggleDay: (day: DayOfWeek) => void;
  onSelectAllDays: () => void;
  onSelectWeekdays: () => void;
  onDelete?: (id: string) => void;
};

export function PeriodFormModal({
  sheetOpen,
  editingPeriodId,
  form,
  setForm,
  formError,
  onClose,
  onSubmit,
  onToggleDay,
  onSelectAllDays,
  onSelectWeekdays,
  onDelete,
}: PeriodFormModalProps) {
  const { sheetRef, scrimRef, dragHandleProps } = useSheetSwipe({ onClose });
  useBodyScrollLock(sheetOpen);

  return (
    <div
      className="sheetLayer"
      data-open={sheetOpen}
      aria-hidden={!sheetOpen}
      inert={!sheetOpen}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <button
        ref={scrimRef as React.RefObject<HTMLButtonElement>}
        className="sheetScrim"
        type="button"
        aria-label="Close form"
        onClick={onClose}
      />
      <section
        ref={sheetRef as React.RefObject<HTMLElement>}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="period-sheet-title"
      >
        <div className="sheetHandleArea" {...dragHandleProps}>
          <div className="sheetHandle" aria-hidden="true" />
        </div>
        <div className="sheetHeading" {...dragHandleProps}>
          <div>
            <h2 id="period-sheet-title">
              {editingPeriodId ? "Edit Period" : "New Period"}
            </h2>
          </div>
          <button
            className="closeButton"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {formError ? <p className="formError" role="alert">{formError}</p> : null}

          <label>
            Period title or subject
            <input
              required
              autoFocus
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="e.g. Period 1: AP Chemistry, Math, Advisory…"
            />
          </label>

          {/* Icon Picker */}
          <div className="iconSelectionGroup">
            <span className="daySelectionLabel">Choose icon</span>
            <div className="iconPickerGrid" role="radiogroup" aria-label="Choose subject icon">
              {PERIOD_ICONS.map(({ id, label }) => {
                const isSelected = form.icon === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`iconPickerOption ${isSelected ? "isSelected" : ""}`}
                    onClick={() => setForm((prev) => ({ ...prev, icon: id }))}
                    aria-checked={isSelected}
                    role="radio"
                    title={label}
                  >
                    <PeriodIcon name={id} size={18} />
                    <span className="iconPickerLabel">{id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="formTimeGrid">
            <label className="formTimeField">
              <span>Start time</span>
              <input
                type="time"
                required
                className="formTimeInput"
                value={form.startTime}
                onChange={(event) =>
                  setForm({ ...form, startTime: event.target.value })
                }
              />
            </label>

            <label className="formTimeField">
              <span>End time</span>
              <input
                type="time"
                required
                className="formTimeInput"
                value={form.endTime}
                onChange={(event) =>
                  setForm({ ...form, endTime: event.target.value })
                }
              />
            </label>
          </div>

          <label>
            Room or location <span>Optional</span>
            <input
              value={form.room}
              onChange={(event) =>
                setForm({ ...form, room: event.target.value })
              }
              placeholder="e.g. Room 204, Building C, Gymnasium…"
            />
          </label>

          <div className="daySelectionGroup">
            <div className="daySelectionHeader">
              <span className="daySelectionLabel">Days active</span>
              <div className="dayPresets">
                <button
                  type="button"
                  className="dayPresetBtn"
                  onClick={onSelectWeekdays}
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  className="dayPresetBtn"
                  onClick={onSelectAllDays}
                >
                  All days
                </button>
              </div>
            </div>

            <div className="dayPillsRow" role="group" aria-label="Select days">
              {ALL_DAYS.map((day) => {
                const isSelected = form.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className={`daySelectPill ${isSelected ? "isSelected" : ""}`}
                    onClick={() => onToggleDay(day)}
                    aria-pressed={isSelected}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <button className="saveButton" type="submit">
            {editingPeriodId ? "Save changes" : "Add period"}
          </button>

          {editingPeriodId && onDelete ? (
            <button
              type="button"
              className="periodDeleteDirectBtn"
              style={{ marginTop: "0.25rem" }}
              onClick={() => {
                onDelete(editingPeriodId);
                onClose();
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span>Delete this period</span>
            </button>
          ) : null}
        </form>
      </section>
    </div>
  );
}
