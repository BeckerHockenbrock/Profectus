import type { JournalEntry } from "../types/journal";

const JOURNAL_STORAGE_KEY_PREFIX = "todo-quest-journal";
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

export const SAMPLE_INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: "sample-entry-1",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    createdAt: Date.now() - 86400000,
    content: "Hit the gym for 45 minutes of heavy squats and cardio. Studied algorithms and data structures for 2 hours before bed, and got a full 8 hours of deep sleep. Felt energized all day.",
    status: "completed",
    analysis: {
      statGains: {
        discipline: 8,
        intellect: 12,
        love: 0,
        social: 0,
        exercise: 15,
        sleep: 10,
      },
      totalXP: 75,
      feedback: "Phenomenal discipline balancing intense physical exertion with cognitive study. Prioritizing 8 hours of sleep ensured full muscle recovery and mental consolidation.",
      keyTakeaway: "Optimal High-Performance Routine",
      sentiment: "positive",
      suggestedFocus: "exercise",
    },
  },
];

export function loadJournalEntries(userId?: string | null): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getJournalStorageKey(userId));
    if (!raw) {
      // Save sample entries on first launch
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
