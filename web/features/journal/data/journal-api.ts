import type { JournalAnalysis } from "../types/journal";
import { getStoredGeminiApiKey } from "./journal-storage";
import { analyzeJournalHeuristically } from "../domain/journal-heuristics";

export interface AnalyzeResult {
  analysis: JournalAnalysis;
  source: "gemini" | "heuristic";
  modelUsed?: string;
}

export async function requestJournalAnalysis(entryText: string): Promise<AnalyzeResult> {
  const customKey = getStoredGeminiApiKey();

  try {
    const response = await fetch("/api/journal/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(customKey ? { "x-gemini-api-key": customKey } : {}),
      },
      body: JSON.stringify({ entryText }),
    });

    const data = await response.json();

    if (response.ok && data.success && data.analysis) {
      return {
        analysis: data.analysis,
        source: "gemini",
        modelUsed: data.modelUsed,
      };
    }

    // If missing API key or quota issue, we still provide intelligent heuristic analysis
    // and note the fallback
    console.warn("Gemini API not available, using heuristic fallback:", data.error || data.message);
    const fallback = analyzeJournalHeuristically(entryText);
    return {
      analysis: fallback,
      source: "heuristic",
    };
  } catch (err) {
    console.warn("Failed to reach Gemini API endpoint, falling back to local heuristics:", err);
    const fallback = analyzeJournalHeuristically(entryText);
    return {
      analysis: fallback,
      source: "heuristic",
    };
  }
}
