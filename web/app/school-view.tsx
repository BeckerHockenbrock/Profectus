"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { DayOfWeek, Period } from "@/lib/school-types";
import {
  ALL_DAYS,
  WEEKDAYS,
  calculateDurationMinutes,
  formatDuration,
  formatTime12Hour,
  getPeriodStatus,
  getTodayDayOfWeek,
  timeToMinutes,
} from "@/lib/school-types";
import { SAMPLE_PERIODS, loadPeriods, savePeriods } from "@/lib/school-storage";
import { useSheetSwipe } from "./use-sheet-swipe";

type SchoolViewProps = {
  userId?: string | null;
  onOpenAddPeriod?: () => void;
};

type PeriodFormData = {
  name: string;
  startTime: string;
  endTime: string;
  room: string;
  days: DayOfWeek[];
};

const initialFormData: PeriodFormData = {
  name: "",
  startTime: "08:30",
  endTime: "09:25",
  room: "",
  days: WEEKDAYS,
};

export function SchoolView({ userId }: SchoolViewProps) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [form, setForm] = useState<PeriodFormData>(initialFormData);
  const [formError, setFormError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Load periods on mount and when userId changes
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setPeriods(loadPeriods(userId));
      setIsLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [userId]);

  // Update live clock every 30 seconds for dynamic period status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingPeriodId(null);
    setForm(initialFormData);
    setFormError("");
  };

  const {
    sheetRef,
    scrimRef,
    dragHandleProps,
  } = useSheetSwipe({ onClose: closeSheet });

  const todayDay = useMemo(() => getTodayDayOfWeek(currentTime), [currentTime]);

  // Determine current active period or next upcoming period today
  const { currentPeriod, nextPeriod } = useMemo(() => {
    let current: { period: Period; minutesRemaining?: number } | null = null;
    let next: { period: Period; minutesUntil?: number } | null = null;

    for (const p of periods) {
      const live = getPeriodStatus(p, currentTime);
      if (!live) continue;
      if (live.status === "current") {
        current = { period: p, minutesRemaining: live.minutesRemaining };
      } else if (live.status === "next" && !next) {
        next = { period: p, minutesUntil: live.minutesUntil };
      } else if (live.status === "upcoming" && !next) {
        next = { period: p, minutesUntil: live.minutesUntil };
      }
    }
    return { currentPeriod: current, nextPeriod: next };
  }, [periods, currentTime]);

  const periodsActiveToday = useMemo(() => {
    return periods.filter((p) => {
      const days = p.days && p.days.length > 0 ? p.days : WEEKDAYS;
      return days.includes(todayDay);
    });
  }, [periods, todayDay]);

  const handleOpenAdd = () => {
    const nextPeriodNum = periods.length + 1;
    setEditingPeriodId(null);
    setForm({
      name: `Period ${nextPeriodNum}`,
      startTime: periods.length > 0 ? periods[periods.length - 1].endTime : "08:30",
      endTime: periods.length > 0 ? calculateNextEndTime(periods[periods.length - 1].endTime, 50) : "09:20",
      room: "",
      days: WEEKDAYS,
    });
    setFormError("");
    setSheetOpen(true);
  };

  const handleOpenEdit = (period: Period) => {
    setEditingPeriodId(period.id);
    setForm({
      name: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
      room: period.room || "",
      days: period.days && period.days.length > 0 ? period.days : WEEKDAYS,
    });
    setFormError("");
    setSheetOpen(true);
  };

  const handleToggleDay = (day: DayOfWeek) => {
    setForm((prev) => {
      const exists = prev.days.includes(day);
      if (exists) {
        // Keep at least one day selected
        if (prev.days.length === 1) return prev;
        return { ...prev, days: prev.days.filter((d) => d !== day) };
      }
      return { ...prev, days: [...prev.days, day] };
    });
  };

  const handleSelectAllDays = () => {
    setForm((prev) => ({ ...prev, days: ALL_DAYS }));
  };

  const handleSelectWeekdays = () => {
    setForm((prev) => ({ ...prev, days: WEEKDAYS }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError("Please enter a period title or name.");
      return;
    }
    if (!form.startTime || !form.endTime) {
      setFormError("Please set both start and end times.");
      return;
    }
    if (timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
      setFormError("End time must be after start time.");
      return;
    }
    if (form.days.length === 0) {
      setFormError("Please choose at least one day.");
      return;
    }

    if (editingPeriodId) {
      const updated = periods.map((p) =>
        p.id === editingPeriodId
          ? {
              ...p,
              name,
              startTime: form.startTime,
              endTime: form.endTime,
              room: form.room.trim() || undefined,
              days: form.days,
            }
          : p,
      );
      setPeriods(updated);
      savePeriods(updated, userId);
    } else {
      const newPeriod: Period = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        name,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room.trim() || undefined,
        days: form.days,
      };
      const updated = [...periods, newPeriod];
      setPeriods(updated);
      savePeriods(updated, userId);
    }

    closeSheet();
  };

  const handleDelete = (id: string) => {
    const updated = periods.filter((p) => p.id !== id);
    setPeriods(updated);
    savePeriods(updated, userId);
    setDeleteConfirmId(null);
  };

  const handleLoadSample = () => {
    const sampleWithIds: Period[] = SAMPLE_PERIODS.map((sample, idx) => ({
      ...sample,
      id: `sample-${Date.now()}-${idx}`,
    }));
    setPeriods(sampleWithIds);
    savePeriods(sampleWithIds, userId);
  };

  return (
    <div className="schoolContent">
      {/* Header section */}
      <section className="schoolHeader" aria-label="School Schedule Header">
        <div className="schoolHeaderTop">
          <div>
            <span className="schoolSubhead">Schedule</span>
            <h1 className="schoolHeading">School</h1>
          </div>
          <button
            type="button"
            className="schoolAddButton"
            onClick={handleOpenAdd}
            aria-label="Add new period"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add period</span>
          </button>
        </div>

        {/* Live Day & Period Status Banner */}
        {currentPeriod ? (
          <div className="schoolLiveBanner isLive" role="status" aria-live="polite">
            <div className="livePulseDot" aria-hidden="true" />
            <div className="liveBannerInfo">
              <span className="liveBannerTag">IN SESSION NOW</span>
              <strong className="liveBannerTitle">{currentPeriod.period.name}</strong>
              <span className="liveBannerMeta">
                Ends at {formatTime12Hour(currentPeriod.period.endTime)}
                {currentPeriod.minutesRemaining !== undefined ? ` · ${currentPeriod.minutesRemaining}m left` : ""}
                {currentPeriod.period.room ? ` · 📍 ${currentPeriod.period.room}` : ""}
              </span>
            </div>
          </div>
        ) : nextPeriod ? (
          <div className="schoolLiveBanner isUpcoming" role="status" aria-live="polite">
            <div className="upcomingDot" aria-hidden="true" />
            <div className="liveBannerInfo">
              <span className="upcomingBannerTag">UP NEXT TODAY</span>
              <strong className="liveBannerTitle">{nextPeriod.period.name}</strong>
              <span className="liveBannerMeta">
                Starts at {formatTime12Hour(nextPeriod.period.startTime)}
                {nextPeriod.minutesUntil !== undefined ? ` · in ${nextPeriod.minutesUntil}m` : ""}
                {nextPeriod.period.room ? ` · 📍 ${nextPeriod.period.room}` : ""}
              </span>
            </div>
          </div>
        ) : null}

        {/* Summary metric strip */}
        <div className="schoolMetricsStrip" aria-label="Schedule summary">
          <div className="metricItem">
            <span>Today</span>
            <strong>{todayDay}</strong>
          </div>
          <div className="metricItem">
            <span>Today&apos;s classes</span>
            <strong>{periodsActiveToday.length}</strong>
          </div>
          <div className="metricItem">
            <span>Total periods</span>
            <strong>{periods.length}</strong>
          </div>
        </div>
      </section>

      {/* Main Period Schedule List */}
      <section className="schoolPeriodSection" aria-label="Periods List">
        <div className="schoolSectionTitleRow">
          <h2>Daily Periods</h2>
          {periods.length > 0 ? (
            <span className="periodCountBadge">{periods.length} {periods.length === 1 ? "period" : "periods"}</span>
          ) : null}
        </div>

        {!isLoaded ? (
          <div className="emptyState">Loading schedule…</div>
        ) : periods.length === 0 ? (
          <div className="schoolEmptyState">
            <div className="emptyIconWrapper">
              <svg
                width="32"
                height="32"
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
            </div>
            <h3>No periods yet</h3>
            <p>Add your class periods and when they take place so your day is organized.</p>
            <div className="emptyActions">
              <button
                type="button"
                className="schoolPrimaryButton"
                onClick={handleOpenAdd}
              >
                + Add your first period
              </button>
              <button
                type="button"
                className="schoolSecondaryButton"
                onClick={handleLoadSample}
              >
                Load sample schedule
              </button>
            </div>
          </div>
        ) : (
          <div className="periodList">
            {periods.map((period, index) => {
              const liveStatus = getPeriodStatus(period, currentTime);
              const duration = calculateDurationMinutes(period.startTime, period.endTime);
              const isCurrent = liveStatus?.status === "current";
              const isNext = liveStatus?.status === "next";

              return (
                <article
                  key={period.id}
                  className={`periodCard ${isCurrent ? "isPeriodCurrent" : ""} ${isNext ? "isPeriodNext" : ""}`}
                >
                  <div className="periodTimeColumn">
                    <span className="periodTimeStart">{formatTime12Hour(period.startTime)}</span>
                    <span className="periodTimeDivider" aria-hidden="true" />
                    <span className="periodTimeEnd">{formatTime12Hour(period.endTime)}</span>
                    <span className="periodDurationTag">{formatDuration(duration)}</span>
                  </div>

                  <div className="periodInfoColumn">
                    <div className="periodTitleRow">
                      <h3 className="periodName">{period.name}</h3>
                      {isCurrent ? (
                        <span className="statusBadge inSession">In session</span>
                      ) : isNext ? (
                        <span className="statusBadge upNext">Up next</span>
                      ) : null}
                    </div>

                    <div className="periodMetaRow">
                      {period.room ? (
                        <span className="periodRoomTag">
                          <svg
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
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{period.room}</span>
                        </span>
                      ) : null}

                      <div className="periodDaysList" aria-label="Days active">
                        {ALL_DAYS.map((day) => {
                          const isActive = (period.days || WEEKDAYS).includes(day);
                          const isToday = day === todayDay;
                          return (
                            <span
                              key={day}
                              className={`periodDayMiniTag ${isActive ? "isActiveDay" : "isInactiveDay"} ${
                                isToday && isActive ? "isTodayActive" : ""
                              }`}
                              title={`${day}: ${isActive ? "Active" : "Off"}`}
                            >
                              {day.slice(0, 1)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="periodActionsColumn">
                    <button
                      type="button"
                      className="periodActionBtn"
                      onClick={() => handleOpenEdit(period)}
                      aria-label={`Edit ${period.name}`}
                      title="Edit period"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="periodActionBtn isDelete"
                      onClick={() => setDeleteConfirmId(period.id)}
                      aria-label={`Delete ${period.name}`}
                      title="Delete period"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal Dialog */}
      {deleteConfirmId ? (
        <div
          className="focusModalOverlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-period-title"
        >
          <div className="focusModalCard">
            <h2 id="delete-period-title">Delete this period?</h2>
            <p>
              Are you sure you want to remove this period from your school schedule?
            </p>
            <div className="focusModalActions">
              <button
                type="button"
                className="quitConfirmButton"
                onClick={() => handleDelete(deleteConfirmId)}
                autoFocus
              >
                Delete
              </button>
              <button
                type="button"
                className="quitCancelButton"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add / Edit Period Bottom Sheet */}
      <div
        className="sheetLayer"
        data-open={sheetOpen}
        aria-hidden={!sheetOpen}
        inert={!sheetOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape") closeSheet();
        }}
      >
        <button
          ref={scrimRef as React.RefObject<HTMLButtonElement>}
          className="sheetScrim"
          type="button"
          aria-label="Close form"
          onClick={closeSheet}
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
              onClick={closeSheet}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
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

            <div className="formTimeGrid">
              <label>
                Start time
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(event) =>
                    setForm({ ...form, startTime: event.target.value })
                  }
                />
              </label>

              <label>
                End time
                <input
                  type="time"
                  required
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
                    onClick={handleSelectWeekdays}
                  >
                    Weekdays
                  </button>
                  <button
                    type="button"
                    className="dayPresetBtn"
                    onClick={handleSelectAllDays}
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
                      onClick={() => handleToggleDay(day)}
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
          </form>
        </section>
      </div>
    </div>
  );
}

function calculateNextEndTime(startTime: string, durationMinutes: number): string {
  const mins = timeToMinutes(startTime) + durationMinutes;
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
