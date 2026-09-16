"use client";

import { useEffect, useMemo, useState } from "react";
import type { Quest } from "@/lib/quest-types";
import type { LifeAttribute, RankPosition, UserStatsProfile } from "@/lib/stats-types";
import { ATTRIBUTE_ORDER, LIFE_ATTRIBUTES, RANK_TIERS } from "@/lib/stats-types";
import {
  calculateAttributeScores,
  calculateOverallRating,
  calculateRankFromRR,
  getDaysRemainingInSeason,
  getSeasonDisplayName,
  loadUserStats,
  saveUserStats,
  simulateMonthlyReset,
} from "@/lib/stats-storage";
import { RadarChart } from "./radar-chart";
import { RankBadge } from "./rank-badge";

interface StatsViewProps {
  userId?: string | null;
  quests: Quest[];
}

// Hexagon icon for attribute cards
function HexagonBadgeIcon({ color, size = 38 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <polygon
        points="20,2 36,11 36,29 20,38 4,29 4,11"
        fill={color}
        fillOpacity="0.22"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <polygon
        points="20,8 30,14 30,26 20,32 10,26 10,14"
        fill={color}
        fillOpacity="0.65"
      />
    </svg>
  );
}

export function StatsView({ userId, quests }: StatsViewProps) {
  const [profile, setProfile] = useState<UserStatsProfile>(() => loadUserStats(userId, quests));
  const [selectedAttr, setSelectedAttr] = useState<LifeAttribute | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // Save profile updates
  const updateProfile = (updater: (prev: UserStatsProfile) => UserStatsProfile) => {
    setProfile((prev) => {
      const next = updater(prev);
      saveUserStats(next, userId);
      return next;
    });
  };

  // Compute live attribute scores
  const attributeScores = useMemo(() => {
    return calculateAttributeScores(quests, profile.attributeOverrides);
  }, [quests, profile.attributeOverrides]);

  const overallRating = useMemo(() => {
    return calculateOverallRating(attributeScores);
  }, [attributeScores]);

  // Compute live rank
  const rank: RankPosition = useMemo(() => {
    return calculateRankFromRR(profile.seasonCumulativeRR);
  }, [profile.seasonCumulativeRR]);

  const daysRemaining = useMemo(() => {
    return getDaysRemainingInSeason();
  }, []);

  const seasonName = useMemo(() => {
    return getSeasonDisplayName(profile.currentSeasonId);
  }, [profile.currentSeasonId]);

  // Quests mapped to currently selected attribute
  const selectedAttrQuests = useMemo(() => {
    if (!selectedAttr) return [];
    return quests.filter((q) => {
      const text = `${q.category} ${q.title}`.toLowerCase();
      const meta = LIFE_ATTRIBUTES[selectedAttr];
      return meta.keywords.some((kw) => text.includes(kw.toLowerCase()));
    });
  }, [quests, selectedAttr]);

  // Manual RR Boost for demonstration / testing grind
  const handleAddFocusBonus = (rrAmount: number) => {
    updateProfile((prev) => {
      const newSeasonRR = prev.seasonCumulativeRR + rrAmount;
      const newLifetimeXP = prev.lifetimeXP + rrAmount;
      const newPeak = Math.max(prev.seasonPeakCumulativeRR, newSeasonRR);
      const newLifetimePeak = Math.max(prev.lifetimePeakCumulativeRR, newSeasonRR);
      return {
        ...prev,
        seasonCumulativeRR: newSeasonRR,
        lifetimeXP: newLifetimeXP,
        monthFocusMinutes: prev.monthFocusMinutes + rrAmount,
        lifetimeFocusMinutes: prev.lifetimeFocusMinutes + rrAmount,
        seasonPeakCumulativeRR: newPeak,
        lifetimePeakCumulativeRR: newLifetimePeak,
      };
    });
  };

  // Trigger monthly soft reset
  const handleSimulateSoftReset = () => {
    const updated = simulateMonthlyReset(profile);
    setProfile(updated);
    saveUserStats(updated, userId);
    setResetNotice(
      `Season Rollover: Soft reset applied! You dropped 2 tiers to ${calculateRankFromRR(updated.seasonCumulativeRR).label}. Time to grind back up!`
    );
  };

  // Two columns matching user's photo:
  // Left: Social, Intellect, Mental
  // Right: Physical, Discipline, Ambition
  const leftColumnAttrs: LifeAttribute[] = ["social", "intellect", "mental"];
  const rightColumnAttrs: LifeAttribute[] = ["physical", "discipline", "ambition"];

  return (
    <div className="statsContainer" aria-label="Progress and Statistics">
      {/* Top Header */}
      <header className="statsHeader">
        <p className="statsTagline">Level up in all areas of your life</p>
        <h1 className="statsMainTitle">Progress.</h1>
      </header>

      {/* Reset Notice Banner */}
      {resetNotice ? (
        <div className="resetAlertBanner" role="status">
          <div className="resetAlertContent">
            <span className="resetAlertIcon" aria-hidden="true">🔄</span>
            <p>{resetNotice}</p>
          </div>
          <button
            type="button"
            className="resetAlertDismiss"
            onClick={() => setResetNotice(null)}
            aria-label="Dismiss reset notice"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Main Hexagonal Radar Chart */}
      <section className="statsRadarSection" aria-label="Overall Attributes Hexagon Chart">
        <RadarChart
          scores={attributeScores}
          overallRating={overallRating}
          totalXP={profile.lifetimeXP}
          selectedAttribute={selectedAttr}
          onSelectAttribute={(attr) => setSelectedAttr(attr === selectedAttr ? null : attr)}
        />
      </section>

      {/* 2-Column Attribute Cards Grid */}
      <section className="statsCardsSection" aria-label="Core Attributes Breakdown">
        <div className="statsCardsColumns">
          {/* Left Column */}
          <div className="statsCardsColumn">
            {leftColumnAttrs.map((attr) => {
              const meta = LIFE_ATTRIBUTES[attr];
              const score = attributeScores[attr];
              const isSelected = selectedAttr === attr;

              return (
                <button
                  key={attr}
                  type="button"
                  className={`statAttributeCard ${isSelected ? "isSelected" : ""}`}
                  style={{
                    borderColor: isSelected ? meta.color : "rgba(255, 255, 255, 0.08)",
                    boxShadow: isSelected ? `0 0 16px ${meta.glowColor}` : undefined,
                  }}
                  onClick={() => setSelectedAttr(isSelected ? null : attr)}
                  aria-label={`${meta.name}: ${score} points. Click to view details`}
                >
                  <div className="statCardIconWrap">
                    <HexagonBadgeIcon color={meta.color} size={36} />
                  </div>
                  <div className="statCardInfo">
                    <span className="statCardScore">{score}</span>
                    <span className="statCardName" style={{ color: meta.color }}>
                      {meta.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="statsCardsColumn">
            {rightColumnAttrs.map((attr) => {
              const meta = LIFE_ATTRIBUTES[attr];
              const score = attributeScores[attr];
              const isSelected = selectedAttr === attr;

              return (
                <button
                  key={attr}
                  type="button"
                  className={`statAttributeCard ${isSelected ? "isSelected" : ""}`}
                  style={{
                    borderColor: isSelected ? meta.color : "rgba(255, 255, 255, 0.08)",
                    boxShadow: isSelected ? `0 0 16px ${meta.glowColor}` : undefined,
                  }}
                  onClick={() => setSelectedAttr(isSelected ? null : attr)}
                  aria-label={`${meta.name}: ${score} points. Click to view details`}
                >
                  <div className="statCardIconWrap">
                    <HexagonBadgeIcon color={meta.color} size={36} />
                  </div>
                  <div className="statCardInfo">
                    <span className="statCardScore">{score}</span>
                    <span className="statCardName" style={{ color: meta.color }}>
                      {meta.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Selected Attribute Drawer/Info */}
      {selectedAttr ? (
        <section className="attrDetailSheet" aria-label="Attribute Details">
          <div className="attrDetailHeader">
            <div className="attrDetailTitleGroup">
              <span
                className="attrDetailDot"
                style={{ backgroundColor: LIFE_ATTRIBUTES[selectedAttr].color }}
                aria-hidden="true"
              />
              <h3>{LIFE_ATTRIBUTES[selectedAttr].name} Details</h3>
            </div>
            <button
              type="button"
              className="attrDetailClose"
              onClick={() => setSelectedAttr(null)}
              aria-label="Close details"
            >
              ✕
            </button>
          </div>
          <p className="attrDetailDesc">{LIFE_ATTRIBUTES[selectedAttr].description}</p>

          <div className="attrDetailQuestsList">
            <h4>Mapped Quests ({selectedAttrQuests.length})</h4>
            {selectedAttrQuests.length === 0 ? (
              <p className="attrDetailEmpty">
                No active quests tagged for {LIFE_ATTRIBUTES[selectedAttr].name}. Create or complete quests with keywords like:{" "}
                <em>{LIFE_ATTRIBUTES[selectedAttr].keywords.slice(0, 4).join(", ")}</em>.
              </p>
            ) : (
              selectedAttrQuests.map((q) => (
                <div key={q.id} className="attrQuestRow">
                  <span className={`attrQuestCheck ${q.completed ? "isDone" : ""}`}>
                    {q.completed ? "✓" : "○"}
                  </span>
                  <span className="attrQuestTitle">{q.title}</span>
                  {q.focusMinutes > 0 ? (
                    <span className="attrQuestXp">{q.focusMinutes}m</span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      {/* Valorant-Style Competitive Rank Ladder Section */}
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

          {/* RR Progress Bar */}
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

          {/* Rank Ladder Sub-stats */}
          <div className="rankLadderMetaRow">
            <div>
              <span className="rankMetaLabel">Act Peak</span>
              <strong className="rankMetaValue">
                {calculateRankFromRR(profile.seasonPeakCumulativeRR).label}
              </strong>
            </div>
            <div>
              <span className="rankMetaLabel">Lifetime Peak</span>
              <strong className="rankMetaValue">
                {calculateRankFromRR(profile.lifetimePeakCumulativeRR).label}
              </strong>
            </div>
            <div>
              <span className="rankMetaLabel">Monthly Focus</span>
              <strong className="rankMetaValue">{profile.monthFocusMinutes}m</strong>
            </div>
          </div>

          {/* Monthly Soft Reset Notice Info */}
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

          {/* Action Buttons: View History & Simulate Reset */}
          <div className="rankActionButtons">
            <button
              type="button"
              className="rankSecondaryBtn"
              onClick={() => setShowHistoryModal(true)}
            >
              📜 Past Act History
            </button>
            <button
              type="button"
              className="rankTestResetBtn"
              onClick={handleSimulateSoftReset}
              title="Simulate monthly soft reset to test progression"
            >
              ⚡ Test Soft Reset
            </button>
          </div>
        </div>
      </section>

      {/* Total XP & Grind Overview */}
      <section className="statsOverviewSection" aria-label="Lifetime XP and Focus Totals">
        <div className="xpCard">
          <div className="xpCardHeader">
            <div>
              <span className="xpCardSubtitle">LIFETIME REPUTATION</span>
              <h3 className="xpCardTitle">{profile.lifetimeXP.toLocaleString()} XP</h3>
            </div>
            <button
              type="button"
              className="quickGrindBtn"
              onClick={() => handleAddFocusBonus(30)}
              title="Add 30 XP test boost"
            >
              +30 XP
            </button>
          </div>

          <div className="xpBreakdownGrid">
            <div className="xpStatBox">
              <span className="xpStatLabel">Act XP</span>
              <strong className="xpStatNum">{profile.seasonCumulativeRR.toLocaleString()}</strong>
            </div>
            <div className="xpStatBox">
              <span className="xpStatLabel">Focus Time</span>
              <strong className="xpStatNum">{Math.floor(profile.lifetimeFocusMinutes / 60)}h {profile.lifetimeFocusMinutes % 60}m</strong>
            </div>
            <div className="xpStatBox">
              <span className="xpStatLabel">Quests Done</span>
              <strong className="xpStatNum">{quests.filter((q) => q.completed).length}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Past Season History Modal */}
      {showHistoryModal ? (
        <div className="historyModalOverlay" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
          <div className="historyModalCard">
            <div className="historyModalHeader">
              <h3 id="history-modal-title">Past Acts & Seasons</h3>
              <button
                type="button"
                className="historyModalClose"
                onClick={() => setShowHistoryModal(false)}
                aria-label="Close past acts"
              >
                ✕
              </button>
            </div>

            <div className="historyModalList">
              {profile.seasonHistory.length === 0 ? (
                <p className="historyEmptyText">No previous acts recorded yet. Complete this month to earn your first Act badge!</p>
              ) : (
                profile.seasonHistory.map((item, idx) => {
                  const finalPos = calculateRankFromRR(
                    (RANK_TIERS.find((t) => t.tier === item.finalTier)?.minCumulativeRR || 0) +
                      (item.finalDivision - 1) * 100 +
                      item.finalRR
                  );

                  return (
                    <div key={idx} className="historyActCard">
                      <RankBadge tier={item.finalTier} division={item.finalDivision} size={48} />
                      <div className="historyActDetails">
                        <h4>{item.seasonName}</h4>
                        <p className="historyActRank">
                          Finish: <strong style={{ color: finalPos.tierMeta.accentColor }}>{finalPos.label}</strong>
                        </p>
                        <span className="historyActXp">{item.totalSeasonXP.toLocaleString()} XP Earned</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
