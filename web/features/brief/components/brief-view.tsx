"use client";

import { WorkspaceHero } from "@/components/shared/workspace-hero";
import { useDailyBrief } from "../hooks/use-daily-brief";

type BriefViewProps = {
  userId: string;
  today: string;
};

function formatBriefDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatUpdatedAt(timestamp: number) {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function BriefView({ userId, today }: BriefViewProps) {
  const { brief, loadError, isLoading } = useDailyBrief(userId, today);
  const updatedLabel = brief ? formatUpdatedAt(brief.updatedAt) : null;

  return (
    <section className="briefView" aria-labelledby="workspace-01">
      <WorkspaceHero index="01" title="Brief">
        <p className="briefDateLine">{formatBriefDate(today)}</p>
      </WorkspaceHero>

      {loadError ? (
        <p className="formError" role="alert">
          {loadError}
        </p>
      ) : null}

      {isLoading ? (
        <p className="briefEmpty">Loading brief…</p>
      ) : brief && (brief.title.trim() || brief.body.trim()) ? (
        <article className="briefArticle">
          {brief.title.trim() ? <h2 className="briefTitle">{brief.title}</h2> : null}
          <div className="briefBody">{brief.body}</div>
          {updatedLabel ? (
            <p className="briefMeta">
              Updated {updatedLabel}
              {brief.updatedBy === "bot" ? " · Grok" : ""}
            </p>
          ) : null}
        </article>
      ) : (
        <p className="briefEmpty">No brief for today yet.</p>
      )}
    </section>
  );
}
