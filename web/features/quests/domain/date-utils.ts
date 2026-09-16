import type { Quest } from "../types/quest";

export function addDays(isoDate: string, daysToAdd: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day + daysToAdd);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function formatDueDate(dueDate: string, today: string) {
  if (!dueDate) return "No date";
  if (dueDate === today) return "Today";
  if (dueDate === addDays(today, 1)) return "Tmrw";

  const [year, month, day] = dueDate.split("-");
  const currentYear = today.slice(0, 4);
  return year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;
}

export function formatDueDateDetail(dueDate: string, today: string) {
  if (!dueDate) return "No due date";
  if (dueDate === today) return "Due today";
  if (dueDate === addDays(today, 1)) return "Due tomorrow";

  const [year, month, day] = dueDate.split("-");
  const currentYear = today.slice(0, 4);
  const formatted = year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;
  return `Due ${formatted}`;
}

export type DateQuestGroup = {
  dateKey: string;
  title: string;
  quests: Quest[];
};

export function formatDateGroupHeading(dueDate: string, today: string): string {
  if (!dueDate) return "No Date";
  if (dueDate === today) return "Today";
  if (dueDate === addDays(today, 1)) return "Tomorrow";
  if (dueDate < today) {
    const [year, month, day] = dueDate.split("-");
    const currentYear = today.slice(0, 4);
    const dateFormatted = year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;
    return `Past Due (${dateFormatted})`;
  }

  const [year, month, day] = dueDate.split("-");
  const currentYear = today.slice(0, 4);
  return year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;
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

