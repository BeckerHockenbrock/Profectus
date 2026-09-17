"use client";

import { useMemo } from "react";
import { useJournal } from "../hooks/use-journal";
import { JournalEntryCard } from "./journal-entry-card";
import { JournalKeyModal } from "./journal-key-modal";
import { LIFE_ATTRIBUTES } from "@/features/stats/types/stats";
import type { LifeAttribute } from "@/features/stats/types/stats";

interface JournalViewProps {
  userId?: string | null;
}

const INSPIRATION_PROMPTS = [
  { label: "🏋️ Workout & Fitness", text: "Crushed a 45-minute workout session today. Felt strong and pushed my limits." },
  { label: "📚 Deep Study", text: "Dedicated 2 hours of distraction-free focus to studying and mastering new concepts." },
  { label: "😴 Restful Sleep", text: "Got 8 solid hours of sleep, woke up refreshed and ready for the day." },
  { label: "🤝 Social Connection", text: "Spent quality time catching up with good friends and shared great conversations." },
  { label: "🎯 Daily Discipline", text: "Stuck strictly to my morning routine, cleaned my workspace, and maintained focus." },
  { label: "💖 Love & Gratitude", text: "Took time to reflect on gratitude, self-care, and showed appreciation to loved ones." },
];

export function JournalView({ userId }: JournalViewProps) {
  const {
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
  } = useJournal(userId);

  const wordCount = useMemo(() => {
    const trimmed = draftContent.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [draftContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftContent.trim() || isAnalyzing) return;
    await submitJournalEntry();
  };

  const handleInsertPrompt = (promptText: string) => {
    setDraftContent((prev) => (prev ? `${prev} ${promptText}` : promptText));
  };

  return (
    <div className="journalContainer" aria-label="Daily Journal and Progression">
      <header className="journalHeader">
        <div className="journalHeaderTop">
          <div>
            <p className="journalTagline">Reflect daily & grow your 6 core attributes</p>
            <h1 className="journalMainTitle">Journal.</h1>
          </div>

          <button
            type="button"
            className="geminiStatusButton"
            onClick={() => setIsKeyModalOpen(true)}
            title="Configure Gemini Flash API Key"
          >
            <span className="geminiSparkleIcon" aria-hidden="true">✨</span>
            <span className="geminiStatusText">
              {hasApiKey ? "Gemini Flash Active" : "Connect Gemini"}
            </span>
          </button>
        </div>
      </header>

      {/* Latest Reward Banner */}
      {latestReward ? (
        <div className="journalRewardBanner" role="status" aria-label="Journal analysis reward">
          <div className="journalRewardHeader">
            <div className="journalRewardTitleRow">
              <span className="journalRewardSparkle" aria-hidden="true">🎉</span>
              <div>
                <h3 className="journalRewardTitle">Progression Points Awarded!</h3>
                <p className="journalRewardSubtitle">
                  {latestReward.analysis.keyTakeaway} · {latestReward.source === "gemini" ? "Gemini Flash AI" : "Local Heuristic AI"}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="journalRewardDismiss"
              onClick={() => setLatestReward(null)}
              aria-label="Dismiss celebration"
            >
              ✕
            </button>
          </div>

          <div className="journalRewardStatsRow">
            <div className="journalRewardXpBadge">
              <span className="journalRewardXpLabel">XP GAINED</span>
              <span className="journalRewardXpNum">+{latestReward.analysis.totalXP}</span>
            </div>

            <div className="journalRewardGainsList">
              {(Object.entries(latestReward.analysis.statGains) as [LifeAttribute, number][])
                .filter(([, val]) => val > 0)
                .map(([attr, val]) => {
                  const meta = LIFE_ATTRIBUTES[attr];
                  return (
                    <span
                      key={attr}
                      className="journalRewardGainTag"
                      style={{
                        borderColor: meta.color,
                        color: meta.color,
                      }}
                    >
                      +{val} {meta.name}
                    </span>
                  );
                })}
            </div>
          </div>

          <p className="journalRewardFeedback">{latestReward.analysis.feedback}</p>
        </div>
      ) : null}

      {/* Daily Composer Section */}
      <section className="journalComposerSection" aria-label="New Journal Entry">
        <form onSubmit={handleSubmit} className="journalComposerCard">
          <div className="journalComposerHeader">
            <span className="journalComposerTitle">Daily Reflection</span>
            <span className="journalWordCounter">{wordCount} words</span>
          </div>

          <textarea
            className="journalTextarea"
            rows={5}
            placeholder="What did you conquer today? Log your workouts, study sessions, sleep, or daily wins. Gemini Flash will analyze your day and level up your stats..."
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            disabled={isAnalyzing}
          />

          {/* Quick inspiration chips */}
          <div className="journalPromptChipsScroll" aria-label="Quick inspiration prompts">
            {INSPIRATION_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                className="journalPromptChip"
                onClick={() => handleInsertPrompt(prompt.text)}
                disabled={isAnalyzing}
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {analysisError ? (
            <p className="journalErrorMessage" role="alert">
              {analysisError}
            </p>
          ) : null}

          <div className="journalComposerFooter">
            <div className="journalStatsPreviewHint">
              <span className="journalHintDot" aria-hidden="true" />
              <span>Rewards: Discipline, Intellect, Love, Social, Exercise, Sleep</span>
            </div>

            <button
              type="submit"
              className="journalSubmitBtn"
              disabled={!draftContent.trim() || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <span className="journalSpinningDot" aria-hidden="true" />
                  <span>Analyzing with Flash...</span>
                </>
              ) : (
                <>
                  <span className="geminiSparkleTiny" aria-hidden="true">✨</span>
                  <span>Reflect & Level Up</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Past Entries Timeline */}
      <section className="journalTimelineSection" aria-label="Past Journal Entries">
        <div className="journalTimelineHeader">
          <h2 className="journalSectionTitle">Journal History</h2>
          <span className="journalEntryCount">{entries.length} entries</span>
        </div>

        {entries.length === 0 ? (
          <div className="journalEmptyState">
            <span className="journalEmptyIcon" aria-hidden="true">📖</span>
            <h3 className="journalEmptyTitle">No journal entries yet</h3>
            <p className="journalEmptyText">
              Write your first reflection above to earn XP and begin leveling up your 6 stats.
            </p>
          </div>
        ) : (
          <div className="journalEntriesList">
            {entries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onDelete={deleteJournalEntry}
              />
            ))}
          </div>
        )}
      </section>

      <JournalKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSaveKey={handleSaveApiKey}
      />
    </div>
  );
}
