"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  addDays,
  getCalendarDays,
  getNextWeekMonday,
} from "../domain/date-utils";

type IosDatePickerPopoverProps = {
  isOpen: boolean;
  currentDate?: string;
  today: string;
  anchorRect?: DOMRect | null;
  onSelectDate: (date: string) => void;
  onClose: () => void;
  title?: string;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

const emptySubscribe = () => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function IosDatePickerDialog({
  currentDate = "",
  today,
  anchorRect,
  onSelectDate,
  onClose,
  title = "Due Date",
}: Omit<IosDatePickerPopoverProps, "isOpen">) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Initialize view month/year to currentDate or today directly in state
  const initialDate = currentDate || today;
  const initialYear = initialDate ? Number(initialDate.slice(0, 4)) : new Date().getFullYear();
  const initialMonth = initialDate ? Number(initialDate.slice(5, 7)) - 1 : new Date().getMonth();

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);

  // Position calculation with viewport boundaries detection
  useLayoutEffect(() => {
    const updatePosition = () => {
      const isMobile = window.innerWidth <= 540;
      if (isMobile || !anchorRect) {
        setPosition(null);
        return;
      }

      const popoverWidth = 324;
      const popoverHeight = 390;
      const margin = 12;

      let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
      left = Math.max(margin, Math.min(window.innerWidth - popoverWidth - margin, left));

      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;

      let top = anchorRect.bottom + 8;
      if (spaceBelow < popoverHeight + margin && spaceAbove > spaceBelow) {
        top = Math.max(margin, anchorRect.top - popoverHeight - 8);
      }

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRect]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const calendarDays = useMemo(() => {
    return getCalendarDays(viewYear, viewMonth, currentDate, today);
  }, [viewYear, viewMonth, currentDate, today]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToTodayMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (today) {
      setViewYear(Number(today.slice(0, 4)));
      setViewMonth(Number(today.slice(5, 7)) - 1);
    }
  };

  const isCurrentViewingTodayMonth = () => {
    if (!today) return false;
    return (
      Number(today.slice(0, 4)) === viewYear &&
      Number(today.slice(5, 7)) - 1 === viewMonth
    );
  };

  // Preset calculations
  const tomorrow = addDays(today, 1);
  const nextWeek = getNextWeekMonday(today);

  const isTodaySelected = currentDate === today;
  const isTomorrowSelected = currentDate === tomorrow;
  const isNextWeekSelected = currentDate === nextWeek;
  const todayDayNum = today ? Number(today.slice(8, 10)) : null;

  return (
    <div
      className="iosDatePickerScrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={popoverRef}
        className={`iosDatePickerPopover${position ? " isPositioned" : " isCentered"}`}
        style={
          position
            ? {
                top: `${position.top}px`,
                left: `${position.left}px`,
              }
            : undefined
        }
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Close button */}
        <div className="iosDatePickerHeader">
          <span className="iosDatePickerTitle">{title}</span>
          <button
            type="button"
            className="iosDatePickerCloseBtn"
            onClick={onClose}
            aria-label="Close date picker"
          >
            ×
          </button>
        </div>

        {/* Quick Action Presets (iOS Reminders / Calendar style) */}
        <div className="iosDatePickerPresets" role="group" aria-label="Quick date choices">
          <button
            type="button"
            className={`iosDatePresetBtn isTodayPreset${isTodaySelected ? " isSelected" : ""}`}
            onClick={() => {
              onSelectDate(today);
              onClose();
            }}
          >
            <div className="iosPresetIconWrapper">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="17" rx="3.5" />
                <line x1="16" y1="2.5" x2="16" y2="5.5" />
                <line x1="8" y1="2.5" x2="8" y2="5.5" />
                <line x1="3" y1="9.5" x2="21" y2="9.5" />
                {todayDayNum ? (
                  <text
                    x="12"
                    y="17.8"
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="700"
                    fill="currentColor"
                    stroke="none"
                    letterSpacing="-0.02em"
                    fontFamily="inherit"
                  >
                    {todayDayNum}
                  </text>
                ) : (
                  <circle cx="12" cy="15" r="1.75" fill="currentColor" stroke="none" />
                )}
              </svg>
            </div>
            <span className="iosPresetLabel">Today</span>
          </button>

          <button
            type="button"
            className={`iosDatePresetBtn isTomorrowPreset${isTomorrowSelected ? " isSelected" : ""}`}
            onClick={() => {
              onSelectDate(tomorrow);
              onClose();
            }}
          >
            <div className="iosPresetIconWrapper">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4.5" />
                <line x1="12" y1="2.5" x2="12" y2="4.5" />
                <line x1="12" y1="19.5" x2="12" y2="21.5" />
                <line x1="2.5" y1="12" x2="4.5" y2="12" />
                <line x1="19.5" y1="12" x2="21.5" y2="12" />
                <line x1="5.28" y1="5.28" x2="6.7" y2="6.7" />
                <line x1="17.3" y1="17.3" x2="18.72" y2="18.72" />
                <line x1="5.28" y1="18.72" x2="6.7" y2="17.3" />
                <line x1="17.3" y1="6.7" x2="18.72" y2="5.28" />
              </svg>
            </div>
            <span className="iosPresetLabel">Tomorrow</span>
          </button>

          <button
            type="button"
            className={`iosDatePresetBtn isNextWeekPreset${isNextWeekSelected ? " isSelected" : ""}`}
            onClick={() => {
              onSelectDate(nextWeek);
              onClose();
            }}
          >
            <div className="iosPresetIconWrapper">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="17" rx="3.5" />
                <line x1="16" y1="2.5" x2="16" y2="5.5" />
                <line x1="8" y1="2.5" x2="8" y2="5.5" />
                <line x1="3" y1="9.5" x2="21" y2="9.5" />
                <path d="M8.5 15.5h7" />
                <path d="m12.5 12.5 3 3-3 3" />
              </svg>
            </div>
            <span className="iosPresetLabel">Next Week</span>
          </button>

          {currentDate ? (
            <button
              type="button"
              className="iosDatePresetBtn isClearPreset"
              onClick={() => {
                onSelectDate("");
                onClose();
              }}
              title="Remove due date"
            >
              <div className="iosPresetIconWrapper">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="17" rx="3.5" />
                  <line x1="16" y1="2.5" x2="16" y2="5.5" />
                  <line x1="8" y1="2.5" x2="8" y2="5.5" />
                  <line x1="3" y1="9.5" x2="21" y2="9.5" />
                  <line x1="9.5" y1="13" x2="14.5" y2="18" />
                  <line x1="14.5" y1="13" x2="9.5" y2="18" />
                </svg>
              </div>
              <span className="iosPresetLabel">No Date</span>
            </button>
          ) : null}
        </div>

        {/* Month / Year Navigator */}
        <div className="iosCalendarHeader">
          <div className="iosCalendarMonthTitle">
            <strong>{MONTH_NAMES[viewMonth]}</strong>
            <span>{viewYear}</span>
            {!isCurrentViewingTodayMonth() ? (
              <button
                type="button"
                className="iosJumpTodayBtn"
                onClick={handleJumpToTodayMonth}
                title="Jump to current month"
              >
                Today
              </button>
            ) : null}
          </div>

          <div className="iosMonthNavControls">
            <button
              type="button"
              className="iosMonthNavBtn"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="iosMonthNavBtn"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* 7-column Weekday Headers */}
        <div className="iosWeekdaysRow" aria-hidden="true">
          {WEEKDAY_NAMES.map((w, idx) => (
            <span key={idx} className="iosWeekdayCell">
              {w}
            </span>
          ))}
        </div>

        {/* 7-column Days Grid */}
        <div className="iosCalendarGrid" role="grid" aria-label={`${MONTH_NAMES[viewMonth]} ${viewYear}`}>
          {calendarDays.map((day) => {
            const isSelected = day.dateString === currentDate;
            const isToday = day.dateString === today;

            return (
              <button
                key={day.dateString}
                type="button"
                className={`iosDayCell${
                  !day.isCurrentMonth ? " isOtherMonth" : ""
                }${isToday ? " isToday" : ""}${
                  isSelected ? " isSelected" : ""
                }`}
                onClick={() => {
                  onSelectDate(day.dateString);
                  onClose();
                }}
                aria-label={day.dateString}
                aria-pressed={isSelected}
              >
                <span className="iosDayInner">
                  {day.dayNumber}
                  {isToday && !isSelected ? <span className="iosTodayDot" aria-hidden="true" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function IosDatePickerPopover(props: IosDatePickerPopoverProps) {
  const isClient = useIsClient();
  if (!props.isOpen || !isClient) return null;

  return createPortal(
    <IosDatePickerDialog
      key={`${props.currentDate ?? ""}_${props.today}`}
      currentDate={props.currentDate}
      today={props.today}
      anchorRect={props.anchorRect}
      onSelectDate={props.onSelectDate}
      onClose={props.onClose}
      title={props.title}
    />,
    document.body,
  );
}
