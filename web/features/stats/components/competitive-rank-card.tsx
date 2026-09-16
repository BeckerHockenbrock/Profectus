import type { RankPosition, UserStatsProfile } from "../types/stats";
import { calculateRankFromRR } from "../domain/rank-math";
import { RankBadge } from "./rank-badge";

type CompetitiveRankCardProps = {
  profile: UserStatsProfile;
  rank: RankPosition;
  seasonName: string;
  daysRemaining: number;
  effectiveSeasonRR: number;
  effectiveLifetimeXP: number;
  effectiveFocusMins: number;
  onOpenHistory: () => void;
  onSimulateSoftReset: () => void;
};

export function CompetitiveRankCard({
  profile,
  rank,
  seasonName,
  daysRemaining,
  effectiveSeasonRR,
  effectiveLifetimeXP,
  effectiveFocusMins,
  onOpenHistory,
  onSimulateSoftReset,
}: CompetitiveRankCardProps) {
  return (
    <section className="competitiveRankSection" aria-labelledby="rank-heading">
      <div className="rankSectionHeader">
        <div>
          <span className="rankSeasonSubtitle">{seasonName}</span>
          <h2 id="rank-heading" className="rankSectionTitle">Competitive Rank</h2>
        </div>
        <div className="rankSeasonCountdown" title="Time until monthly soft reset">
          <span className="countdownDot" aria-hidden="true" />
          <span>{daysRemaining}d left in Act</span>
        </div>
      </div>

      <div className={`rankMainCard ${rank.isUngodlyLockedIn ? "isLockedIn" : ""}`}>
        {rank.isUngodlyLockedIn ? (
          <div className="lockedInPill" aria-label="Ungodly Locked In Status">
            <span className="flameIcon" aria-hidden="true">🔥</span>
            <span>UNGODLY LOCKED IN</span>
          </div>
        ) : null}

        <div className="rankEmblemRow">
          <RankBadge tier={rank.tier} division={rank.division} size={76} />
          <div className="rankTitlesCol">
            <span className="rankTierSmall">CURRENT RANK</span>
            <h3 className="rankTierName" style={{ color: rank.tierMeta.accentColor }}>
              {rank.label.toUpperCase()}
            </h3>
            <span className="rankRrSummary">
              {rank.tier === "radiant"
                ? `${rank.divisionRR} RR (Apex Tier)`
                : `${rank.divisionRR} / 100 RR`}
            </span>
          </div>
        </div>

        <div className="rankProgressBarTrack" role="progressbar" aria-valuenow={rank.progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="rankProgressBarFill"
            style={{
              width: `${Math.min(100, Math.max(5, rank.progressPercent))}%`,
              backgroundColor: rank.tierMeta.accentColor,
              boxShadow: `0 0 10px ${rank.tierMeta.badgeGlow}`,
            }}
          />
        </div>

        <div className="rankLadderMetaRow">
          <div>
            <span className="rankMetaLabel">Act Peak</span>
            <strong className="rankMetaValue">
              {calculateRankFromRR(Math.max(profile.seasonPeakCumulativeRR, effectiveSeasonRR)).label}
            </strong>
          </div>
          <div>
            <span className="rankMetaLabel">Lifetime Peak</span>
            <strong className="rankMetaValue">
              {calculateRankFromRR(Math.max(profile.lifetimePeakCumulativeRR, effectiveLifetimeXP)).label}
            </strong>
          </div>
          <div>
            <span className="rankMetaLabel">Monthly Focus</span>
            <strong className="rankMetaValue">{effectiveFocusMins}m</strong>
          </div>
        </div>

        <div className="softResetExplainer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>
            <strong>Monthly Soft Reset:</strong> Ranks reset on the 1st of every month. You drop 2 full tiers (6 divisions) instead of restarting at zero.
          </span>
        </div>

        <div className="rankActionButtons">
          <button
            type="button"
            className="rankSecondaryBtn"
            onClick={onOpenHistory}
          >
            📜 Past Act History
          </button>
          <button
            type="button"
            className="rankTestResetBtn"
            onClick={onSimulateSoftReset}
            title="Simulate monthly soft reset to test progression"
          >
            ⚡ Test Soft Reset
          </button>
        </div>
      </div>
    </section>
  );
}
