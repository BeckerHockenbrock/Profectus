import type { LifeAttribute } from "@/features/stats/types/stats";

export type JournalStatGains = Record<LifeAttribute, number>;

export interface JournalAnalysis {
  statGains: JournalStatGains;
  totalXP: number;
  feedback: string;
  keyTakeaway: string;
  sentiment?: "positive" | "reflective" | "challenging" | "neutral";
  suggestedFocus?: LifeAttribute;
}

export interface JournalEntry {
  id: string;
  userId?: string | null;
  date: string; // YYYY-MM-DD
  createdAt: number; // Unix timestamp
  title?: string;
  content: string;
  analysis?: JournalAnalysis | null;
  status: "idle" | "analyzing" | "completed" | "error";
  errorMessage?: string;
}

export interface JournalAnalyzePayload {
  entryText: string;
  date?: string;
  title?: string;
}

export interface JournalAnalyzeResponse {
  success: boolean;
  analysis?: JournalAnalysis;
  error?: string;
  modelUsed?: string;
}
