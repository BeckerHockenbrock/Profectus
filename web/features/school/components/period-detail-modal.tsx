"use client";

import { useEffect } from "react";
import type React from "react";
import { useBodyScrollLock } from "@/components/shared/use-body-scroll-lock";
import { useSheetSwipe } from "@/components/shared/use-sheet-swipe";
import type { DayOfWeek, Period, PeriodStatusInfo } from "../types/school";
import { ALL_DAYS, WEEKDAYS } from "../types/school";
import {
  calculateDurationMinutes,
  formatDuration,
  formatTime12Hour,
} from "../domain/period-clock";
import { PeriodIcon } from "./period-icon";

type PeriodDetailModalProps = {
  period: Period;
  liveStatus: PeriodStatusInfo | null;
  todayDay: DayOfWeek;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function PeriodDetailModal({
  period,
  liveStatus,
  todayDay,
  onClose,
  onEdit,
  onDelete,
}: PeriodDetailModalProps) {
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

  return (
    <div
      ref={scrimRef as React.RefObject<HTMLDivElement>}
      className="detailModalScrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="period-detail-title"
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
          <div className="periodDetailHeaderBadge">
            <PeriodIcon name={period.icon || "book"} size={18} />
            <span>{formatDuration(calculateDurationMinutes(period.startTime, period.endTime))}</span>
          </div>
          <button
            type="button"
            className="detailCloseButton"
            onClick={onClose}
            aria-label="Close details"
          >
            ×
          </button>
        </header>

        <div className="detailModalBody">
          <h2 id="period-detail-title" className="detailTitle">
            {period.name}
          </h2>

          {liveStatus ? (
            <div className="detailMetaRow">
              {liveStatus.status === "current" ? (
                <span className="detailStatusPill isCompleted">
                  In Session · {liveStatus.minutesRemaining}m remaining
                </span>
              ) : liveStatus.status === "next" ? (
                <span className="detailStatusPill inProgress">
                  Up Next · Starts in {liveStatus.minutesUntil}m
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="periodDetailGrid">
            <div className="periodDetailItem">
              <span className="periodDetailLabel">Time</span>
              <strong className="periodDetailValue">
                {formatTime12Hour(period.startTime)} – {formatTime12Hour(period.endTime)}
              </strong>
            </div>

            <div className="periodDetailItem">
              <span className="periodDetailLabel">Room / Location</span>
              <strong className="periodDetailValue">
                {period.room ? period.room : "No room set"}
              </strong>
            </div>

            <div className="periodDetailItem fullWidth">
              <span className="periodDetailLabel">Active Days</span>
              <div className="periodDetailDays">
                {ALL_DAYS.map((d) => {
                  const active = (period.days || WEEKDAYS).includes(d);
                  const isToday = d === todayDay;
                  return (
                    <span
                      key={d}
                      className={`detailDayPill ${active ? "isActive" : ""} ${isToday && active ? "isToday" : ""}`}
                    >
                      {d}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="periodDetailActions">
            <button
              type="button"
              className="schoolPrimaryButton fullWidth"
              onClick={onEdit}
            >
              Edit Period
            </button>

            <button
              type="button"
              className="periodDeleteDirectBtn"
              onClick={onDelete}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span>Delete Period</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
