import type { DayOfWeek, Period, PeriodStatusInfo } from "../types/school";
import { WEEKDAYS } from "../types/school";

export function timeToMinutes(time24: string): number {
  if (!time24) return 0;
  const [hours, minutes] = time24.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function formatTime12Hour(time24: string): string {
  if (!time24) return "";
  const [hoursStr, minutesStr] = time24.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr ? minutesStr.padStart(2, "0") : "00";
  if (isNaN(hours)) return time24;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes} ${ampm}`;
}

export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const diff = end - start;
  return diff > 0 ? diff : 0;
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function getTodayDayOfWeek(date: Date = new Date()): DayOfWeek {
  const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday, ...
  const map: Record<number, DayOfWeek> = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
  };
  return map[dayIndex] ?? "Mon";
}

export function getPeriodStatus(
  period: Period,
  now: Date = new Date(),
): PeriodStatusInfo | null {
  const todayDay = getTodayDayOfWeek(now);
  const days = period.days && period.days.length > 0 ? period.days : WEEKDAYS;

  if (!days.includes(todayDay)) {
    return null;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(period.startTime);
  const endMinutes = timeToMinutes(period.endTime);

  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
    return {
      status: "current",
      minutesRemaining: endMinutes - currentMinutes,
    };
  }

  if (currentMinutes < startMinutes) {
    const diff = startMinutes - currentMinutes;
    if (diff <= 30) {
      return {
        status: "next",
        minutesUntil: diff,
      };
    }
    return {
      status: "upcoming",
      minutesUntil: diff,
    };
  }

  return { status: "past" };
}

export function calculateNextEndTime(startTime: string, durationMinutes: number): string {
  const mins = timeToMinutes(startTime) + durationMinutes;
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
