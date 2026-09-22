import type { FocusSessionRecord, DailyFocusStats } from "../types/focus";
import { getLocalTodayString } from "@/features/quests/domain/date-utils";

const SESSIONS_KEY_PREFIX = "todo-quest-focus-sessions";

function getSessionsStorageKey(userId?: string | null): string {
  return `${SESSIONS_KEY_PREFIX}-${userId || "default"}`;
}

export function loadFocusSessions(userId?: string | null): FocusSessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getSessionsStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error("Failed to load focus sessions from storage:", error);
    return [];
  }
}

export function saveFocusSession(
  session: FocusSessionRecord,
  userId?: string | null,
): FocusSessionRecord[] {
  if (typeof window === "undefined") return [session];
  try {
    const existing = loadFocusSessions(userId);
    const updated = [session, ...existing].slice(0, 200); // keep last 200 sessions
    localStorage.setItem(getSessionsStorageKey(userId), JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Failed to save focus session:", error);
    return [session];
  }
}

export function getTodayStats(
  sessions: FocusSessionRecord[],
  today: string = getLocalTodayString(),
): DailyFocusStats {
  const todaySessions = sessions.filter((s) => s.date === today);
  const totalMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const blocksCompleted = todaySessions.reduce((acc, s) => acc + s.blocksCompleted, 0);

  return {
    date: today,
    totalMinutes,
    blocksCompleted,
    sessionsCount: todaySessions.length,
  };
}

/**
 * Calculates current streak (consecutive calendar days with at least 1 session).
 * Allows streak to be active if user focused today or yesterday.
 */
export function calculateGrindStreak(
  sessions: FocusSessionRecord[],
  today: string = getLocalTodayString(),
): number {
  if (sessions.length === 0) return 0;

  const datesSet = new Set(sessions.map((s) => s.date));
  let streak = 0;

  // Start from today or yesterday
  const parseDate = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day);
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const curr = parseDate(today);

  // Check if today has focus
  const todayFocused = datesSet.has(today);
  if (!todayFocused) {
    // Check yesterday
    curr.setDate(curr.getDate() - 1);
    const yesterday = formatDate(curr);
    if (!datesSet.has(yesterday)) {
      return 0;
    }
  }

  // Count backwards
  while (datesSet.has(formatDate(curr))) {
    streak += 1;
    curr.setDate(curr.getDate() - 1);
  }

  return streak;
}
