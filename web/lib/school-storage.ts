import type { Period } from "./school-types";
import { timeToMinutes } from "./school-types";

const STORAGE_KEY_PREFIX = "todo-quest-periods";

export const SAMPLE_PERIODS: Omit<Period, "id">[] = [
  {
    name: "Period 1: Mathematics",
    startTime: "08:30",
    endTime: "09:25",
    room: "Room 102",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    color: "#4f46e5",
    icon: "calculator",
  },
  {
    name: "Period 2: Chemistry",
    startTime: "09:35",
    endTime: "10:30",
    room: "Lab B",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    color: "#059669",
    icon: "flask",
  },
  {
    name: "Period 3: English Literature",
    startTime: "10:40",
    endTime: "11:35",
    room: "Room 204",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    color: "#d97706",
    icon: "book",
  },
  {
    name: "Lunch Break",
    startTime: "11:35",
    endTime: "12:15",
    room: "Cafeteria",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    color: "#6b7280",
    icon: "coffee",
  },
  {
    name: "Period 4: History",
    startTime: "12:20",
    endTime: "13:15",
    room: "Room 310",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    color: "#dc2626",
    icon: "globe",
  },
  {
    name: "Period 5: Computer Science",
    startTime: "13:25",
    endTime: "14:20",
    room: "Tech Hall 1",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    color: "#2563eb",
    icon: "laptop",
  },
  {
    name: "Period 6: Physical Education",
    startTime: "14:30",
    endTime: "15:25",
    room: "Gymnasium",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    color: "#7c3aed",
    icon: "trophy",
  },
];

export function getStorageKey(userId?: string | null): string {
  return `${STORAGE_KEY_PREFIX}-${userId || "default"}`;
}

export function loadPeriods(userId?: string | null): Period[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed: Period[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortPeriodsChronologically(parsed);
  } catch (error) {
    console.error("Failed to load periods from storage:", error);
    return [];
  }
}

export function savePeriods(periods: Period[], userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const sorted = sortPeriodsChronologically(periods);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(sorted));
  } catch (error) {
    console.error("Failed to save periods to storage:", error);
  }
}

export function sortPeriodsChronologically(periods: Period[]): Period[] {
  return [...periods].sort((a, b) => {
    const startDiff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    if (startDiff !== 0) return startDiff;
    return timeToMinutes(a.endTime) - timeToMinutes(b.endTime);
  });
}
