"use client";

import { useMemo, useState } from "react";
import { useJournal } from "../hooks/use-journal";
import { JournalEntryCard } from "./journal-entry-card";
import { JournalKeyModal } from "./journal-key-modal";
import { LIFE_ATTRIBUTES } from "@/features/stats/types/stats";
import type { LifeAttribute } from "@/features/stats/types/stats";

interface JournalViewProps {
  userId?: string | null;
}

const STAT_ORDER: LifeAttribute[] = [
  "discipline",
  "intellect",
  "love",
  "social",
  "exercise",
  "sleep",
];

const STAT_PROMPT_CONFIG: Record<
  LifeAttribute,
  {
    placeholder: string;
    guidance: string;
    chips: string[];
  }
> = {
  discipline: {
    placeholder: "Log today's discipline: What morning routines did you hold? What friction or temptations did you overcome? What habits did you execute with zero excuses?",
    guidance: "Graded strictly on willpower, habit adherence, and resisting distractions. Standard days land around 60-70%. 85%+ requires pushing through intense friction.",
    chips: [
      "Woke up on first alarm, no phone for 2 hours",
      "Held strictly to my daily time blocks and shutdown",
      "Resisted procrastination and completed high-friction chores",
    ],
  },
  intellect: {
    placeholder: "Log today's intellect: What academic subjects, books, or technical problems did you tackle? How many hours of deep, focused cognitive work did you complete?",
    guidance: "Graded on depth of cognitive effort and active problem solving. 80%+ requires deep, uninterrupted academic or intellectual engagement.",
    chips: [
      "Studied 2.5 hours of uninterrupted deep work",
      "Read 30 pages of dense technical theory",
      "Solved complex algorithm problems without looking at hints",
    ],
  },
  love: {
    placeholder: "Log today's love & gratitude: What intentional acts of care, kindness, or affection did you show? How did you practice healthy self-compassion?",
    guidance: "Graded on authentic emotional presence, self-care, and selfless kindness. 80%+ requires vulnerability, sacrifice, or heartfelt depth.",
    chips: [
      "Took time to write a gratitude reflection",
      "Cooked and shared an undistracted meal with loved ones",
      "Practiced patience and offered help without expecting return",
    ],
  },
  social: {
    placeholder: "Log today's social connection: Who did you talk to, call, or spend quality time with? How did you listen and contribute to your relationships or community?",
    guidance: "Graded on active relationship maintenance and meaningful communication. 80%+ requires proactive connection and genuine presence.",
    chips: [
      "Called a close friend to check in on their week",
      "Had an engaging in-person conversation over lunch",
      "Participated actively in a team or club meetup",
    ],
  },
  exercise: {
    placeholder: "Log today's physical training: What was your workout? Note specific mileage, sets, weights, heart rate, or athletic intensity pushed through...",
    guidance: "Graded on physical intensity, volume, and athletic effort. Standard gym sessions score 65-75%. 85%+ requires intense, demanding PR or high aerobic output.",
    chips: [
      "Ran 4.5 miles at high cadence with hill sprints",
      "Completed 5x5 heavy squat session and core workout",
      "45 min high-intensity functional circuit with minimal rest",
    ],
  },
  sleep: {
    placeholder: "Log today's sleep & recovery: How many hours did you sleep? Was your bedtime consistent? Did you practice good wind-down hygiene? How rested do you feel?",
    guidance: "Graded on sleep duration (7-9 hrs optimal), consistency, and recovery. 85%+ requires consistent sleep schedule and waking fully refreshed.",
    chips: [
      "Slept 8 hours uninterrupted in a dark, cool room",
      "Screens off 1 hour before bed, asleep by 10:30 PM",
      "Woke up naturally with high morning energy and alertness",
    ],
  },
};

export function JournalView({ userId }: JournalViewProps) {
  const {
    selectedStat,
    setSelectedStat,
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
  } = useJournal(userId);

  const [viewMode, setViewMode] = useState<"current" | "all">("current");

  const wordCount = useMemo(() => {
    const trimmed = draftContent.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [draftContent]);

  const currentStatMeta = LIFE_ATTRIBUTES[selectedStat];
  const currentStatPrompt = STAT_PROMPT_CONFIG[selectedStat];
  const currentAverage = statAverages[selectedStat] || 0;
  const hasLoggedToday = Boolean(todayEntriesByStat[selectedStat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftContent.trim() || isAnalyzing) return;
    await submitStatEntry(selectedStat);
  };

  const handleInsertPrompt = (text: string) => {
    setDraftContent((prev) => (prev ? `${prev} ${text}` : text));
  };

  return (
    <div className="journalContainer" aria-label="Daily Stat Journals">
      <header className="journalHeader">
        <div className="journalHeaderTop">
          <div>
            <p className="journalTagline">1 journal entry per stat · Strict 0–100% average score</p>
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

      {/* 6-Stat Switcher Tabs */}
      <section className="journalStatSelectorSection" aria-label="Stat Navigation">
        <div className="journalStatPillTabs">
          {STAT_ORDER.map((stat) => {
            const meta = LIFE_ATTRIBUTES[stat];
            const isSelected = selectedStat === stat;
            const avg = statAverages[stat] || 0;
            const isLoggedToday = Boolean(todayEntriesByStat[stat]);

            return (
              <button
                key={stat}
                type="button"
                className={`journalStatTabBtn ${isSelected ? "isActive" : ""}`}
                style={{
                  borderColor: isSelected ? meta.color : "rgba(255, 255, 255, 0.08)",
                  boxShadow: isSelected ? `0 0 14px ${meta.glowColor}` : undefined,
                }}
                onClick={() => {
                  setSelectedStat(stat);
                  setDraftContent("");
                }}
                aria-pressed={isSelected}
              >
                <div className="journalStatTabHeader">
                  <span
                    className="journalTabDot"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden="true"
                  />
                  <span className="journalTabName">{meta.name}</span>
                  {isLoggedToday ? (
                    <span className="journalTodayCheck" title="Logged today">✓</span>
                  ) : null}
                </div>
                <div className="journalTabScoreRow">
                  <span
                    className="journalTabScore"
                    style={{ color: isSelected ? meta.color : "var(--text)" }}
                  >
                    {avg}%
                  </span>
                  <span className="journalTabAvgLabel">avg</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Latest Reward Banner */}
      {latestReward ? (
        <div className="journalRewardBanner" role="status" aria-label="Journal analysis reward">
          <div className="journalRewardHeader">
            <div className="journalRewardTitleRow">
              <span className="journalRewardSparkle" aria-hidden="true">🎯</span>
              <div>
                <h3 className="journalRewardTitle">
                  {LIFE_ATTRIBUTES[latestReward.evaluation.stat].name} Graded: {latestReward.evaluation.score}%
                </h3>
                <p className="journalRewardSubtitle">
                  {latestReward.evaluation.keyTakeaway} · New Average: {latestReward.updatedAverage}%
                </p>
              </div>
            </div>
            <button
              type="button"
              className="journalRewardDismiss"
              onClick={() => setLatestReward(null)}
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>

          <div className="journalRewardStatsRow">
            <div className="journalRewardXpBadge">
              <span className="journalRewardXpLabel">ENTRY SCORE</span>
              <span
                className="journalRewardXpNum"
                style={{ color: LIFE_ATTRIBUTES[latestReward.evaluation.stat].color }}
              >
                {latestReward.evaluation.score}%
              </span>
            </div>

            <div className="journalRewardXpBadge">
              <span className="journalRewardXpLabel">XP EARNED</span>
              <span className="journalRewardXpNum">+{latestReward.evaluation.xpEarned} XP</span>
            </div>

            <div className="journalRewardXpBadge">
              <span className="journalRewardXpLabel">TREE AVERAGE</span>
              <span className="journalRewardXpNum">{latestReward.updatedAverage}%</span>
            </div>
          </div>

          <p className="journalRewardFeedback">{latestReward.evaluation.feedback}</p>
        </div>
      ) : null}

      {/* Active Stat Card & Composer */}
      <section className="journalComposerSection" aria-label={`${currentStatMeta.name} Journal`}>
        <form onSubmit={handleSubmit} className="journalComposerCard">
          <div className="journalComposerHeader">
            <div className="journalComposerStatMeta">
              <span
                className="journalStatTag"
                style={{
                  color: currentStatMeta.color,
                  borderColor: currentStatMeta.color,
                  backgroundColor: `${currentStatMeta.color}15`,
                }}
              >
                {currentStatMeta.name} Journal
              </span>
              <span className="journalAverageTag">Current Average: {currentAverage}%</span>
              {hasLoggedToday ? (
                <span className="journalLoggedTodayPill">✓ Logged Today</span>
              ) : null}
            </div>
            <span className="journalWordCounter">{wordCount} words</span>
          </div>

          <p className="journalGuidanceText">{currentStatPrompt.guidance}</p>

          <textarea
            className="journalTextarea"
            rows={5}
            placeholder={currentStatPrompt.placeholder}
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            disabled={isAnalyzing}
          />

          {/* Quick inspiration prompts for this stat */}
          <div className="journalPromptChipsScroll" aria-label="Inspiration prompts">
            {currentStatPrompt.chips.map((chipText) => (
              <button
                key={chipText}
                type="button"
                className="journalPromptChip"
                onClick={() => handleInsertPrompt(chipText)}
                disabled={isAnalyzing}
              >
                + {chipText}
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
              <span
                className="journalHintDot"
                style={{ backgroundColor: currentStatMeta.color }}
                aria-hidden="true"
              />
              <span>Scores are averaged into your {currentStatMeta.name} stat tree</span>
            </div>

            <button
              type="submit"
              className="journalSubmitBtn"
              disabled={!draftContent.trim() || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <span className="journalSpinningDot" aria-hidden="true" />
                  <span>Evaluating {currentStatMeta.name}...</span>
                </>
              ) : (
                <>
                  <span className="geminiSparkleTiny" aria-hidden="true">✨</span>
                  <span>Evaluate & Update {currentStatMeta.name}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Entries List for Current Stat */}
      <section className="journalTimelineSection" aria-label="Journal Entries">
        <div className="journalTimelineHeader">
          <div className="journalTimelineFilterRow">
            <button
              type="button"
              className={`journalFilterToggle ${viewMode === "current" ? "isActive" : ""}`}
              onClick={() => setViewMode("current")}
            >
              {currentStatMeta.name} Entries ({filteredEntries.length})
            </button>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="journalEmptyState">
            <span className="journalEmptyIcon" aria-hidden="true">📝</span>
            <h3 className="journalEmptyTitle">No {currentStatMeta.name} entries yet</h3>
            <p className="journalEmptyText">
              Write your first reflection for {currentStatMeta.name} above. Gemini Flash will grade your effort (0-100%) and establish your stat tree average.
            </p>
          </div>
        ) : (
          <div className="journalEntriesList">
            {filteredEntries.map((entry) => (
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
