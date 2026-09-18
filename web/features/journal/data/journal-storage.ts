import type { LifeAttribute } from "@/features/stats/types/stats";
import type { JournalEntry } from "../types/journal";

const JOURNAL_STORAGE_KEY_PREFIX = "todo-quest-journal-v2";
const GEMINI_KEY_STORAGE_KEY = "todo-quest-gemini-api-key";

export function getJournalStorageKey(userId?: string | null): string {
  return `${JOURNAL_STORAGE_KEY_PREFIX}-${userId || "default"}`;
}

export function getStoredGeminiApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function saveStoredGeminiApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    if (key.trim()) {
      localStorage.setItem(GEMINI_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
    }
  } catch (err) {
    console.error("Failed to save Gemini API key to local storage:", err);
  }
}

export function removeStoredGeminiApiKey(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
  } catch {}
}

const oneDayAgo = Date.now() - 86400000;
const todayIso = new Date().toISOString().split("T")[0];
const yesterdayIso = new Date(oneDayAgo).toISOString().split("T")[0];

// 1 starter entry for each stat demonstrating the strict evaluation standard
export const SAMPLE_INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: "starter-discipline-1",
    stat: "discipline",
    date: yesterdayIso,
    createdAt: oneDayAgo - 1000,
    content: "Woke up at 6:00 AM on first alarm. Avoided checking social media or distractions until deep work was finished. Followed full evening shutdown.",
    status: "completed",
    score: 78,
    xpEarned: 49,
    feedback: "Solid habit execution. Resisting early phone impulses protected your cognitive momentum for the day.",
    keyTakeaway: "Strong Morning Boundary",
    sentiment: "positive",
  },
  {
    id: "starter-exercise-1",
    stat: "exercise",
    date: yesterdayIso,
    createdAt: oneDayAgo - 2000,
    content: "Ran 4 miles in 32 minutes, then hit 4 sets of heavy Romanian deadlifts and pull-ups. Pushed into high heart rate zones.",
    status: "completed",
    score: 75,
    xpEarned: 47,
    feedback: "High aerobic standard paired with posterior chain strength work. Maintained good pacing despite fatigue.",
    keyTakeaway: "Rigorous Hybrid Training",
    sentiment: "positive",
  },
  {
    id: "starter-intellect-1",
    stat: "intellect",
    date: yesterdayIso,
    createdAt: oneDayAgo - 3000,
    content: "Worked through 3 complex algorithmic problems on graph traversals and read 25 pages of distributed systems theory.",
    status: "completed",
    score: 72,
    xpEarned: 46,
    feedback: "Substantial cognitive demand tackled without shortcuts. Good balance of active problem-solving and foundational reading.",
    keyTakeaway: "Deep Algorithmic Focus",
    sentiment: "positive",
  },
  {
    id: "starter-sleep-1",
    stat: "sleep",
    date: yesterdayIso,
    createdAt: oneDayAgo - 4000,
    content: "In bed by 10:30 PM with dark curtains and cool room. Slept uninterrupted for 7.8 hours and woke up feeling physically recharged.",
    status: "completed",
    score: 82,
    xpEarned: 51,
    feedback: "Optimal circadian consistency. Getting nearly 8 full hours of uninterrupted sleep significantly enhances neuromuscular recovery.",
    keyTakeaway: "High-Quality Night Rest",
    sentiment: "positive",
  },
  {
    id: "starter-love-1",
    stat: "love",
    date: yesterdayIso,
    createdAt: oneDayAgo - 5000,
    content: "Cooked a healthy dinner for family and spent undistracted quality time listening to their day. Took 15 minutes for quiet gratitude.",
    status: "completed",
    score: 68,
    xpEarned: 44,
    feedback: "Genuine emotional presence and intentional gratitude. Practicing selfless attentiveness strengthens deep bonds.",
    keyTakeaway: "Intentional Family Presence",
    sentiment: "positive",
  },
  {
    id: "starter-social-1",
    stat: "social",
    date: yesterdayIso,
    createdAt: oneDayAgo - 6000,
    content: "Called an old friend I haven't spoken with in 6 months to catch up. Joined colleagues for an active discussion during lunch.",
    status: "completed",
    score: 64,
    xpEarned: 42,
    feedback: "Proactive social maintenance. Reaching out across distance requires intention and sustains your support network.",
    keyTakeaway: "Proactive Friendship Outreach",
    sentiment: "positive",
  },
];

/**
 * Calculates the arithmetic average score (0 to 100%) for each of the 6 stats
 * based on all completed journal entries for that stat.
 */
export function calculateStatAverages(entries: JournalEntry[]): Record<LifeAttribute, number> {
  const totals: Record<LifeAttribute, { sum: number; count: number }> = {
    discipline: { sum: 0, count: 0 },
    intellect: { sum: 0, count: 0 },
    love: { sum: 0, count: 0 },
    social: { sum: 0, count: 0 },
    exercise: { sum: 0, count: 0 },
    sleep: { sum: 0, count: 0 },
  };

  for (const entry of entries) {
    if (entry.status === "completed" && typeof entry.score === "number") {
      totals[entry.stat].sum += entry.score;
      totals[entry.stat].count += 1;
    }
  }

  const averages: Record<LifeAttribute, number> = {
    discipline: 0,
    intellect: 0,
    love: 0,
    social: 0,
    exercise: 0,
    sleep: 0,
  };

  const attributes: LifeAttribute[] = ["discipline", "intellect", "love", "social", "exercise", "sleep"];
  for (const attr of attributes) {
    const { sum, count } = totals[attr];
    averages[attr] = count > 0 ? Math.round(sum / count) : 0;
  }

  return averages;
}

export function loadJournalEntries(userId?: string | null): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getJournalStorageKey(userId));
    if (!raw) {
      saveJournalEntries(SAMPLE_INITIAL_ENTRIES, userId);
      return SAMPLE_INITIAL_ENTRIES;
    }
    const parsed: JournalEntry[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Failed to load journal entries from storage:", error);
    return [];
  }
}

export function saveJournalEntries(entries: JournalEntry[], userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);
    localStorage.setItem(getJournalStorageKey(userId), JSON.stringify(sorted));
  } catch (error) {
    console.error("Failed to save journal entries to storage:", error);
  }
}
