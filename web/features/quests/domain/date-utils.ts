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

export function formatDueDateDetail(dueDate: string, today: string, completed = false) {
  if (!dueDate) return "No due date";
  const dayInfo = getDayOfWeekFromISO(dueDate);
  const daySuffix = dayInfo ? ` (${dayInfo.full})` : "";

  if (dueDate === today) return `Due today${daySuffix}`;
  if (dueDate === addDays(today, 1)) return `Due tomorrow${daySuffix}`;

  const [year, month, day] = dueDate.split("-");
  const currentYear = today.slice(0, 4);
  const formattedDate = year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;

  if (today && dueDate < today && !completed) {
    return dayInfo ? `Past due (${dayInfo.full}, ${formattedDate})` : `Past due (${formattedDate})`;
  }

  return dayInfo ? `Due ${dayInfo.full}, ${formattedDate}` : `Due ${formattedDate}`;
}

export function formatGoogleTaskDueDate(dueDate: string, today: string): string {
  if (!dueDate) return "";
  if (dueDate === today) return "Due today";
  if (dueDate === addDays(today, 1)) return "Due tomorrow";
  if (dueDate === addDays(today, -1)) return "Due yesterday";

  const [year, month, day] = dueDate.split("-");
  const currentYear = today ? today.slice(0, 4) : new Date().getFullYear().toString();
  const dayInfo = getDayOfWeekFromISO(dueDate);
  const dayPrefix = dayInfo ? `${dayInfo.short}, ` : "";
  const formattedDate = year === currentYear ? `${Number(month)}/${Number(day)}` : `${Number(month)}/${Number(day)}/${year}`;

  return `Due ${dayPrefix}${formattedDate}`;
}

export type DueDateStatus = "overdue" | "today" | "tomorrow" | "future" | "none";

export function getDueDateStatus(dueDate: string, today: string, completed = false): DueDateStatus {
  if (!dueDate) return "none";
  if (completed) return "future";
  if (today && dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  if (today && dueDate === addDays(today, 1)) return "tomorrow";
  return "future";
}


export type DateQuestGroup = {
  dateKey: string;
  title: string;
  quests: Quest[];
};

export function isQuestInDateGroup(quest: Quest, dateKey: string): boolean {
  if (dateKey === "") {
    if (quest.dueDate) return false;
    const subtasks = quest.subtasks ?? [];
    return subtasks.length === 0 || subtasks.some((st) => !st.dueDate);
  }
  if (quest.dueDate === dateKey) {
    return true;
  }
  const subtasks = quest.subtasks ?? [];
  return subtasks.some((st) => st.dueDate === dateKey);
}

export function getQuestSubtasksForDate(quest: Quest, dateKey: string): Quest["subtasks"] {
  const subtasks = quest.subtasks ?? [];
  if (dateKey === "") {
    return subtasks.filter((st) => !st.dueDate);
  }
  if (quest.dueDate === dateKey) {
    return subtasks.filter((st) => st.dueDate === dateKey || !st.dueDate);
  }
  return subtasks.filter((st) => st.dueDate === dateKey);
}

export function isQuestCompletedForDate(quest: Quest, dateKey: string): boolean {
  if (quest.completed) return true;
  if (quest.dueDate === dateKey) return false;
  const subtasksForDate = getQuestSubtasksForDate(quest, dateKey) ?? [];
  return subtasksForDate.length > 0 && subtasksForDate.every((st) => st.completed);
}

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
  const dateSet = new Set<string>();

  for (const quest of quests) {
    if (quest.dueDate) {
      dateSet.add(quest.dueDate);
    }
    const subtasks = quest.subtasks ?? [];
    for (const st of subtasks) {
      if (st.dueDate) {
        dateSet.add(st.dueDate);
      }
    }
    if (!quest.dueDate && (subtasks.length === 0 || subtasks.some((st) => !st.dueDate))) {
      dateSet.add("");
    }
  }

  const rawDates = Array.from(dateSet);
  const dated = rawDates.filter(Boolean).sort((a, b) => a.localeCompare(b));
  const hasNoDate = rawDates.includes("");
  const sortedDateKeys = hasNoDate ? [...dated, ""] : dated;

  return sortedDateKeys
    .filter((dateKey) => {
      if (today && dateKey && dateKey < today) {
        return quests.some((quest) => {
          if (!isQuestInDateGroup(quest, dateKey)) return false;
          if (quest.completed) return false;
          if (quest.dueDate === dateKey) return true;
          const dateSubtasks = getQuestSubtasksForDate(quest, dateKey) ?? [];
          return dateSubtasks.some((st) => !st.completed);
        });
      }
      return true;
    })
    .map((dateKey) => ({
      dateKey,
      title: formatDateGroupHeading(dateKey, today),
      quests: quests
        .filter((quest) => isQuestInDateGroup(quest, dateKey))
        .map((quest) => ({
          ...quest,
          dueDate: quest.dueDate === dateKey ? quest.dueDate : "",
          completed: isQuestCompletedForDate(quest, dateKey),
          subtasks: getQuestSubtasksForDate(quest, dateKey),
        })),
    }));
}

