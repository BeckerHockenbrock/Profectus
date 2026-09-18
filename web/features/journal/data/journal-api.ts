import type { LifeAttribute } from "@/features/stats/types/stats";
import type { JournalStatEvaluation } from "../types/journal";
import { getStoredGeminiApiKey } from "./journal-storage";
import { analyzeJournalHeuristically } from "../domain/journal-heuristics";

export interface AnalyzeResult {
  evaluation: JournalStatEvaluation;
  source: "gemini" | "heuristic";
  modelUsed?: string;
}

export async function requestJournalAnalysis(
  entryText: string,
  stat: LifeAttribute,
): Promise<AnalyzeResult> {
  const customKey = getStoredGeminiApiKey();

  try {
    const response = await fetch("/api/journal/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(customKey ? { "x-gemini-api-key": customKey } : {}),
      },
      body: JSON.stringify({ entryText, stat }),
    });

    const data = await response.json();

    if (response.ok && data.success && data.evaluation) {
      return {
        evaluation: data.evaluation,
        source: "gemini",
        modelUsed: data.modelUsed,
      };
    }

    console.warn("Gemini API not available, using strict heuristic fallback:", data.error || data.message);
    const fallback = analyzeJournalHeuristically(entryText, stat);
    return {
      evaluation: fallback,
      source: "heuristic",
    };
  } catch (err) {
    console.warn("Failed to reach Gemini API endpoint, falling back to local heuristics:", err);
    const fallback = analyzeJournalHeuristically(entryText, stat);
    return {
      evaluation: fallback,
      source: "heuristic",
    };
  }
}
