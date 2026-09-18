import type { LifeAttribute } from "@/features/stats/types/stats";

export interface JournalStatEvaluation {
  stat: LifeAttribute;
  score: number; // 0 to 100% evaluated mastery/performance
  xpEarned: number; // XP awarded to player rank
  feedback: string;
  keyTakeaway: string;
  sentiment?: "positive" | "reflective" | "challenging" | "neutral";
}

export interface JournalEntry {
  id: string;
  userId?: string | null;
  stat: LifeAttribute; // Which of the 6 stats this entry is for
  date: string; // YYYY-MM-DD
  createdAt: number; // Unix timestamp
  title?: string;
  content: string;
  score?: number; // 0 to 100%
  xpEarned?: number;
  feedback?: string;
  keyTakeaway?: string;
  sentiment?: "positive" | "reflective" | "challenging" | "neutral";
  status: "idle" | "analyzing" | "completed" | "error";
  errorMessage?: string;
}

export interface JournalStatAverage {
  stat: LifeAttribute;
  averageScore: number;
  entryCount: number;
  latestScore?: number;
}

export interface JournalAnalyzePayload {
  entryText: string;
  stat: LifeAttribute;
  date?: string;
  title?: string;
}

export interface JournalAnalyzeResponse {
  success: boolean;
  evaluation?: JournalStatEvaluation;
  error?: string;
  modelUsed?: string;
}
