"use client";

import { useCallback, useEffect, useState } from "react";
import type { JournalAnalysis, JournalEntry } from "../types/journal";
import {
  getStoredGeminiApiKey,
  loadJournalEntries,
  saveJournalEntries,
  saveStoredGeminiApiKey,
} from "../data/journal-storage";
import { requestJournalAnalysis } from "../data/journal-api";
import { applyJournalRewards } from "@/features/stats/data/stats-storage";

export function useJournal(userId?: string | null) {
  const [entries, setEntries] = useState<JournalEntry[]>(() => loadJournalEntries(userId));
  const [draftContent, setDraftContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [latestReward, setLatestReward] = useState<{
    entry: JournalEntry;
    analysis: JournalAnalysis;
    source: "gemini" | "heuristic";
  } | null>(null);
  const [hasApiKey, setHasApiKey] = useState(() => {
    const key = getStoredGeminiApiKey();
    return Boolean(key && key.trim().length > 0);
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Synchronize API key changes across tabs or external storage updates
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

  const submitJournalEntry = useCallback(
    async (contentToSubmit?: string) => {
      const text = (contentToSubmit ?? draftContent).trim();
      if (!text) return false;

      setIsAnalyzing(true);
      setAnalysisError(null);

      const entryId = `journal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const todayDate = new Date().toISOString().split("T")[0];

      const newEntry: JournalEntry = {
        id: entryId,
        userId: userId || null,
        date: todayDate,
        createdAt: Date.now(),
        content: text,
        status: "analyzing",
      };

      // Optimistically add entry
      setEntries((prev) => {
        const next = [newEntry, ...prev];
        saveJournalEntries(next, userId);
        return next;
      });

      try {
        const { analysis, source } = await requestJournalAnalysis(text);

        const completedEntry: JournalEntry = {
          ...newEntry,
          status: "completed",
          analysis,
        };

        // Update entry in state and storage
        setEntries((prev) => {
          const next = prev.map((e) => (e.id === entryId ? completedEntry : e));
          saveJournalEntries(next, userId);
          return next;
        });

        // Award stats and XP to the user profile
        applyJournalRewards(userId, analysis.statGains, analysis.totalXP);

        // Show reward banner / celebration
        setLatestReward({
          entry: completedEntry,
          analysis,
          source,
        });

        setDraftContent("");
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to analyze journal entry.";
        setAnalysisError(message);

        setEntries((prev) => {
          const next = prev.map((e) =>
            e.id === entryId ? { ...e, status: "error" as const, errorMessage: message } : e,
          );
          saveJournalEntries(next, userId);
          return next;
        });

        return false;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [draftContent, userId],
  );

  const deleteJournalEntry = useCallback(
    (id: string) => {
      setEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        saveJournalEntries(next, userId);
        return next;
      });
      if (latestReward?.entry.id === id) {
        setLatestReward(null);
      }
    },
    [latestReward, userId],
  );

  return {
    entries,
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
    submitJournalEntry,
    deleteJournalEntry,
  };
}
