"use client";

import type { JournalEntry } from "../types/journal";
import { LIFE_ATTRIBUTES } from "@/features/stats/types/stats";
import type { LifeAttribute } from "@/features/stats/types/stats";

interface JournalEntryCardProps {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}

export function JournalEntryCard({ entry, onDelete }: JournalEntryCardProps) {
  const formattedDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = new Date(entry.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const analysis = entry.analysis;
  const isAnalyzing = entry.status === "analyzing";
  const hasError = entry.status === "error";

  const statEntries = analysis
    ? (Object.entries(analysis.statGains) as [LifeAttribute, number][]).filter(
        ([, score]) => score > 0,
      )
    : [];

  return (
    <article className="journalEntryCard" aria-label={`Journal entry for ${formattedDate}`}>
      <header className="journalEntryHeader">
        <div className="journalEntryMeta">
          <time className="journalEntryDate" dateTime={new Date(entry.createdAt).toISOString()}>
            {formattedDate} · {formattedTime}
          </time>
          {analysis?.keyTakeaway ? (
            <span className="journalEntryBadge">{analysis.keyTakeaway}</span>
          ) : null}
        </div>

        <div className="journalEntryActions">
          {analysis?.totalXP ? (
            <span className="journalXpPill" title="Total XP awarded">
              +{analysis.totalXP} XP
            </span>
          ) : null}
          <button
            type="button"
            className="journalDeleteBtn"
            onClick={() => {
              if (window.confirm("Delete this journal entry?")) {
                onDelete(entry.id);
              }
            }}
            aria-label="Delete entry"
            title="Delete entry"
          >
            ✕
          </button>
        </div>
      </header>

      <p className="journalEntryContent">{entry.content}</p>

      {isAnalyzing ? (
        <div className="journalEntryAnalyzingNotice">
          <span className="journalSpinningIcon" aria-hidden="true">✨</span>
          <span>Gemini Flash is analyzing your reflection...</span>
        </div>
      ) : null}

      {hasError ? (
        <div className="journalEntryErrorNotice">
          <span>⚠️ {entry.errorMessage || "Analysis could not be generated."}</span>
        </div>
      ) : null}

      {analysis ? (
        <div className="journalAnalysisSection">
          {statEntries.length > 0 ? (
            <div className="journalStatPillsGrid" aria-label="Stat gains">
              {statEntries.map(([attr, gain]) => {
                const meta = LIFE_ATTRIBUTES[attr];
                return (
                  <div
                    key={attr}
                    className="journalStatPill"
                    style={{
                      borderColor: meta.color,
                      color: meta.color,
                      backgroundColor: `${meta.color}14`,
                    }}
                  >
                    <span className="journalStatPillName">{meta.name}</span>
                    <span className="journalStatPillValue">+{gain}</span>
                  </div>
                );
              })}
            </div>
          ) : null}

          {analysis.feedback ? (
            <blockquote className="journalFeedbackQuote">
              <span className="journalAiTag">
                <span className="geminiSparkleTiny" aria-hidden="true">✨</span> Gemini Flash Coach
              </span>
              <p className="journalFeedbackText">{analysis.feedback}</p>
            </blockquote>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
