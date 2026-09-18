"use client";

import type { JournalEntry } from "../types/journal";
import { LIFE_ATTRIBUTES } from "@/features/stats/types/stats";

interface JournalEntryCardProps {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}

export function JournalEntryCard({ entry, onDelete }: JournalEntryCardProps) {
  const meta = LIFE_ATTRIBUTES[entry.stat];

  const formattedDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = new Date(entry.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const isAnalyzing = entry.status === "analyzing";
  const hasError = entry.status === "error";

  return (
    <article className="journalEntryCard" aria-label={`${meta.name} entry for ${formattedDate}`}>
      <header className="journalEntryHeader">
        <div className="journalEntryMeta">
          <span
            className="journalStatIndicatorPill"
            style={{
              borderColor: meta.color,
              color: meta.color,
              backgroundColor: `${meta.color}18`,
            }}
          >
            {meta.name}
          </span>
          <time className="journalEntryDate" dateTime={new Date(entry.createdAt).toISOString()}>
            {formattedDate} · {formattedTime}
          </time>
          {entry.keyTakeaway ? (
            <span className="journalEntryBadge">{entry.keyTakeaway}</span>
          ) : null}
        </div>

        <div className="journalEntryActions">
          {typeof entry.score === "number" ? (
            <span
              className="journalScoreBadge"
              style={{
                color: meta.color,
                borderColor: `${meta.color}40`,
                backgroundColor: `${meta.color}12`,
              }}
              title="Evaluated performance score for this entry"
            >
              {entry.score}%
            </span>
          ) : null}
          {entry.xpEarned ? (
            <span className="journalXpPill" title="XP awarded to total player ladder">
              +{entry.xpEarned} XP
            </span>
          ) : null}
          <button
            type="button"
            className="journalDeleteBtn"
            onClick={() => {
              if (window.confirm(`Delete this ${meta.name} entry?`)) {
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
          <span>Gemini Flash is rigorously evaluating your {meta.name} entry...</span>
        </div>
      ) : null}

      {hasError ? (
        <div className="journalEntryErrorNotice">
          <span>⚠️ {entry.errorMessage || "Evaluation could not be generated."}</span>
        </div>
      ) : null}

      {entry.feedback ? (
        <blockquote className="journalFeedbackQuote">
          <span className="journalAiTag">
            <span className="geminiSparkleTiny" aria-hidden="true">✨</span> Gemini Flash Judge
          </span>
          <p className="journalFeedbackText">{entry.feedback}</p>
        </blockquote>
      ) : null}
    </article>
  );
}
