import type { Quest } from "../types/quest";

export function getLocalTodayString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(isoDate: string, daysToAdd: number): string {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(Date.UTC(year, month - 1, day + daysToAdd));
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getDayOfWeekFromISO(isoDate: string): { short: string; full: string } | null {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const dayIndex = date.getUTCDay();
  return { short: SHORT_DAYS[dayIndex], full: FULL_DAYS[dayIndex] };
}

export function formatDueDate(dueDate: string, today: string) {
  if (!dueDate) return "No date";
  const dayInfo = getDayOfWeekFromISO(dueDate);
  const daySuffix = dayInfo ? ` (${dayInfo.full})` : "";

  if (dueDate === today) return `Today${daySuffix}`;
  if (dueDate === addDays(today, 1)) return `Tomorrow${daySuffix}`;

  const [year, month, day] = dueDate.split("-");
  const currentYear = today.slice(0, 4);
  const formattedDate = year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;
  return dayInfo ? `${dayInfo.full}, ${formattedDate}` : formattedDate;
}

export function formatDueDateDetail(dueDate: string, today: string) {
  if (!dueDate) return "No due date";
  const dayInfo = getDayOfWeekFromISO(dueDate);
  const daySuffix = dayInfo ? ` (${dayInfo.full})` : "";

  if (dueDate === today) return `Due today${daySuffix}`;
  if (dueDate === addDays(today, 1)) return `Due tomorrow${daySuffix}`;

  const [year, month, day] = dueDate.split("-");
  const currentYear = today.slice(0, 4);
  const formattedDate = year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;

  if (today && dueDate < today) {
    return dayInfo ? `Past due (${dayInfo.full}, ${formattedDate})` : `Past due (${formattedDate})`;
  }

  return dayInfo ? `Due ${dayInfo.full}, ${formattedDate}` : `Due ${formattedDate}`;
}

export type DateQuestGroup = {
  dateKey: string;
  title: string;
  quests: Quest[];
};

export function formatDateGroupHeading(dueDate: string, today: string): string {
  if (!dueDate) return "No Date";
  const dayInfo = getDayOfWeekFromISO(dueDate);
  const daySuffix = dayInfo ? ` (${dayInfo.full})` : "";

  if (dueDate === today) return `Today${daySuffix}`;
  if (dueDate === addDays(today, 1)) return `Tomorrow${daySuffix}`;

  const [year, month, day] = dueDate.split("-");
  const currentYear = today.slice(0, 4);
  const formattedDate = year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;

  if (today && dueDate < today) {
    return dayInfo ? `Past Due (${dayInfo.full}, ${formattedDate})` : `Past Due (${formattedDate})`;
  }

  return dayInfo ? `${dayInfo.full}, ${formattedDate}` : formattedDate;
}

export function groupQuestsByDate(quests: Quest[], today: string): DateQuestGroup[] {
  const rawDates = Array.from(new Set(quests.map((quest) => quest.dueDate)));
  const dated = rawDates.filter(Boolean).sort((a, b) => a.localeCompare(b));
  const hasNoDate = rawDates.includes("");
  const sortedDateKeys = hasNoDate ? [...dated, ""] : dated;

  return sortedDateKeys.map((dateKey) => ({
    dateKey,
    title: formatDateGroupHeading(dateKey, today),
    quests: quests.filter((quest) => quest.dueDate === dateKey),
  }));
}

