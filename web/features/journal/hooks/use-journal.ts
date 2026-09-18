"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LifeAttribute } from "@/features/stats/types/stats";
import type { JournalEntry, JournalStatEvaluation } from "../types/journal";
import {
  calculateStatAverages,
  getStoredGeminiApiKey,
  loadJournalEntries,
  saveJournalEntries,
  saveStoredGeminiApiKey,
} from "../data/journal-storage";
import { requestJournalAnalysis } from "../data/journal-api";
import { applyJournalRewards } from "@/features/stats/data/stats-storage";

export function useJournal(userId?: string | null) {
  const [selectedStat, setSelectedStat] = useState<LifeAttribute>("discipline");
  const [entries, setEntries] = useState<JournalEntry[]>(() => loadJournalEntries(userId));
  const [draftContent, setDraftContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [latestReward, setLatestReward] = useState<{
    entry: JournalEntry;
    evaluation: JournalStatEvaluation;
    source: "gemini" | "heuristic";
    updatedAverage: number;
  } | null>(null);
  const [hasApiKey, setHasApiKey] = useState(() => {
    const key = getStoredGeminiApiKey();
    return Boolean(key && key.trim().length > 0);
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Synchronize API key changes across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "todo-quest-gemini-api-key") {
        const key = getStoredGeminiApiKey();
        setHasApiKey(Boolean(key && key.trim().length > 0));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleSaveApiKey = useCallback((newKey: string) => {
    saveStoredGeminiApiKey(newKey);
    setHasApiKey(Boolean(newKey && newKey.trim().length > 0));
    setIsKeyModalOpen(false);
  }, []);

  // Compute stat averages (0 to 100%) for each of the 6 stats
  const statAverages = useMemo(() => {
    return calculateStatAverages(entries);
  }, [entries]);

  // Today's entries mapped by stat
  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  const todayEntriesByStat = useMemo(() => {
    const map: Partial<Record<LifeAttribute, JournalEntry>> = {};
    for (const entry of entries) {
      if (entry.date === todayIso && entry.status === "completed") {
        map[entry.stat] = entry;
      }
    }
    return map;
  }, [entries, todayIso]);

  // Entries filtered for the currently selected stat
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => e.stat === selectedStat);
  }, [entries, selectedStat]);

  const submitStatEntry = useCallback(
    async (stat: LifeAttribute, contentToSubmit?: string) => {
      const text = (contentToSubmit ?? draftContent).trim();
      if (!text) return false;

      setIsAnalyzing(true);
      setAnalysisError(null);

      const entryId = `journal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const todayDate = new Date().toISOString().split("T")[0];

      const newEntry: JournalEntry = {
        id: entryId,
        userId: userId || null,
        stat,
        date: todayDate,
        createdAt: Date.now(),
        content: text,
        status: "analyzing",
      };

      // Optimistically add entry
      const optimisticEntries = [newEntry, ...entries];
      setEntries(optimisticEntries);
      saveJournalEntries(optimisticEntries, userId);

      try {
        const { evaluation, source } = await requestJournalAnalysis(text, stat);

        const completedEntry: JournalEntry = {
          ...newEntry,
          status: "completed",
          score: evaluation.score,
          xpEarned: evaluation.xpEarned,
          feedback: evaluation.feedback,
          keyTakeaway: evaluation.keyTakeaway,
          sentiment: evaluation.sentiment,
        };

        const updatedEntries = optimisticEntries.map((e) => (e.id === entryId ? completedEntry : e));
        setEntries(updatedEntries);
        saveJournalEntries(updatedEntries, userId);

        // Recalculate average scores across all entries including this new one
        const newAverages = calculateStatAverages(updatedEntries);

        // Apply reward to user profile (persisting updated average score and XP)
        applyJournalRewards(userId, stat, evaluation.score, evaluation.xpEarned, newAverages);

        setLatestReward({
          entry: completedEntry,
          evaluation,
          source,
          updatedAverage: newAverages[stat],
        });

        setDraftContent("");
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to evaluate journal entry.";
        setAnalysisError(message);

        const errorEntries = optimisticEntries.map((e) =>
          e.id === entryId ? { ...e, status: "error" as const, errorMessage: message } : e,
        );
        setEntries(errorEntries);
        saveJournalEntries(errorEntries, userId);

        return false;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [draftContent, entries, userId],
  );

  const deleteJournalEntry = useCallback(
    (id: string) => {
      const next = entries.filter((e) => e.id !== id);
      setEntries(next);
      saveJournalEntries(next, userId);

      // Recalculate averages and sync with stats profile
      const newAverages = calculateStatAverages(next);
      applyJournalRewards(userId, selectedStat, 0, 0, newAverages);

      if (latestReward?.entry.id === id) {
        setLatestReward(null);
      }
    },
    [entries, latestReward, selectedStat, userId],
  );

  return {
    selectedStat,
    setSelectedStat,
    entries,
    filteredEntries,
    statAverages,
    todayEntriesByStat,
    draftContent,
    setDraftContent,
    isAnalyzing,
    analysisError,
    latestReward,
    setLatestReward,
    hasApiKey,
    isKeyModalOpen,
    setIsKeyModalOpen,
    handleSaveApiKey,
    submitStatEntry,
    deleteJournalEntry,
  };
}
