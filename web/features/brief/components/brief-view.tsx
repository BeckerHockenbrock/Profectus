"use client";

import { WorkspaceHero } from "@/components/shared/workspace-hero";
import { useDailyBrief } from "../hooks/use-daily-brief";
import type { DailyBrief } from "../types/brief";

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
  return <BriefScreen today={today} brief={brief} loadError={loadError} isLoading={isLoading} />;
}

type BriefScreenProps = {
  today: string;
  brief: DailyBrief | null;
  loadError: string;
  isLoading: boolean;
};

export function BriefScreen({ today, brief, loadError, isLoading }: BriefScreenProps) {
  const hasBrief = Boolean(brief && (brief.title.trim() || brief.body.trim()));
  const updatedLabel = brief ? formatUpdatedAt(brief.updatedAt) : null;
  const readingMinutes = brief ? Math.max(1, Math.ceil(brief.body.trim().split(/\s+/).length / 200)) : 0;

  return (
    <section className="briefView" aria-labelledby="workspace-01">
      <WorkspaceHero index="01" title="Brief">
        <p className="briefLead">A little perspective for the day ahead.</p>
      </WorkspaceHero>

      <article className="briefArticle" aria-busy={isLoading}>
        <header className="briefDateline">
          <time dateTime={today}>{formatBriefDate(today)}</time>
          {hasBrief && !isLoading && !loadError ? <span>{readingMinutes} min read</span> : null}
        </header>

        {loadError ? (
          <div className="briefEmpty">
            <BriefSun />
            <h2>A quiet pause.</h2>
            <p role="alert">{loadError} Please try again a little later.</p>
          </div>
        ) : isLoading ? (
          <div className="briefLoading" role="status">
            <span className="briefEyebrow">Getting your day in view</span>
            <div className="briefSkeleton" aria-hidden="true"><span /><span /><span /><span /></div>
            <p>Loading your brief…</p>
          </div>
        ) : hasBrief && brief ? (
          <>
            <div className="briefArticleHeading">
              <span className="briefEyebrow">Your daily perspective</span>
              <h2 className="briefTitle">{brief.title.trim() || "A fresh perspective."}</h2>
            </div>
            <div className="briefBody">
              {brief.body.trim() ? brief.body.trim().split(/\n\s*\n/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              )) : null}
            </div>
            <footer className="briefMeta">
              <span>{brief.updatedBy === "bot" ? "Prepared by Grok" : "Your daily brief"}</span>
              {updatedLabel ? <span>Updated {updatedLabel}</span> : null}
            </footer>
          </>
        ) : (
          <div className="briefEmpty" role="status">
            <BriefSun />
            <span className="briefEyebrow">A fresh page</span>
            <h2>The day is still unfolding.</h2>
            <p>Your brief hasn’t arrived yet.<br />When it does, you’ll find it right here.</p>
          </div>
        )}
      </article>
    </section>
  );
}

function BriefSun() {
  return (
    <svg className="briefSun" viewBox="0 0 120 88" fill="none" aria-hidden="true">
      <path d="M8 65h104M24 74h72M43 82h34M32 65a28 28 0 0 1 56 0M60 9v12M20 25l9 9M100 25l-9 9M9 48l12 3M111 48l-12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
