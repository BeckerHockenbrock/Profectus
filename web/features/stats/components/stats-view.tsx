"use client";

import type { Quest } from "@/features/quests/types/quest";
import type { LifeAttribute } from "../types/stats";
import { useUserStats } from "../hooks/use-user-stats";
import { AttributeCard } from "./attribute-card";
import { AttributeDetailSheet } from "./attribute-detail-sheet";
import { CompetitiveRankCard } from "./competitive-rank-card";
import { HistoryModal } from "./history-modal";
import { RadarChart } from "./radar-chart";

interface StatsViewProps {
  userId?: string | null;
  quests: Quest[];
}

const LEFT_COLUMN_ATTRIBUTES: LifeAttribute[] = ["social", "intellect", "mental"];
const RIGHT_COLUMN_ATTRIBUTES: LifeAttribute[] = ["physical", "discipline", "ambition"];

export function StatsView({ userId, quests }: StatsViewProps) {
  const {
    profile,
    selectedAttr,
    setSelectedAttr,
    showHistoryModal,
    setShowHistoryModal,
    resetNotice,
    setResetNotice,
    effectiveLifetimeXP,
    effectiveSeasonRR,
    effectiveFocusMins,
    effectiveQuestsCompleted,
    attributeScores,
    overallRating,
    rank,
    daysRemaining,
    seasonName,
    selectedAttrQuests,
    handleAddFocusBonus,
    handleSimulateSoftReset,
  } = useUserStats(userId, quests);

  const toggleAttribute = (attribute: LifeAttribute) => {
    setSelectedAttr(attribute === selectedAttr ? null : attribute);
  };

  return (
    <div className="statsContainer" aria-label="Progress and Statistics">
      <header className="statsHeader">
        <p className="statsTagline">Level up in all areas of your life</p>
        <h1 className="statsMainTitle">Progress.</h1>
      </header>

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

      <section className="statsRadarSection" aria-label="Overall Attributes Hexagon Chart">
        <RadarChart
          scores={attributeScores}
          overallRating={overallRating}
          totalXP={effectiveLifetimeXP}
          selectedAttribute={selectedAttr}
          onSelectAttribute={toggleAttribute}
        />
      </section>

      <section className="statsCardsSection" aria-label="Core Attributes Breakdown">
        <div className="statsCardsColumns">
          <div className="statsCardsColumn">
            {LEFT_COLUMN_ATTRIBUTES.map((attribute) => (
              <AttributeCard
                key={attribute}
                attribute={attribute}
                score={attributeScores[attribute]}
                isSelected={selectedAttr === attribute}
                onSelect={toggleAttribute}
              />
            ))}
          </div>

          <div className="statsCardsColumn">
            {RIGHT_COLUMN_ATTRIBUTES.map((attribute) => (
              <AttributeCard
                key={attribute}
                attribute={attribute}
                score={attributeScores[attribute]}
                isSelected={selectedAttr === attribute}
                onSelect={toggleAttribute}
              />
            ))}
          </div>
        </div>
      </section>

      {selectedAttr ? (
        <AttributeDetailSheet
          attribute={selectedAttr}
          quests={selectedAttrQuests}
          onClose={() => setSelectedAttr(null)}
        />
      ) : null}

      <CompetitiveRankCard
        profile={profile}
        rank={rank}
        seasonName={seasonName}
        daysRemaining={daysRemaining}
        effectiveSeasonRR={effectiveSeasonRR}
        effectiveLifetimeXP={effectiveLifetimeXP}
        effectiveFocusMins={effectiveFocusMins}
        onOpenHistory={() => setShowHistoryModal(true)}
        onSimulateSoftReset={handleSimulateSoftReset}
      />

      <section className="statsOverviewSection" aria-label="Lifetime XP and Focus Totals">
        <div className="xpCard">
          <div className="xpCardHeader">
            <div>
              <span className="xpCardSubtitle">LIFETIME REPUTATION</span>
              <h3 className="xpCardTitle">{effectiveLifetimeXP.toLocaleString()} XP</h3>
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
              <strong className="xpStatNum">{effectiveSeasonRR.toLocaleString()}</strong>
            </div>
            <div className="xpStatBox">
              <span className="xpStatLabel">Focus Time</span>
              <strong className="xpStatNum">{Math.floor(effectiveFocusMins / 60)}h {effectiveFocusMins % 60}m</strong>
            </div>
            <div className="xpStatBox">
              <span className="xpStatLabel">Quests Done</span>
              <strong className="xpStatNum">{effectiveQuestsCompleted}</strong>
            </div>
          </div>
        </div>
      </section>

      {showHistoryModal ? (
        <HistoryModal
          history={profile.seasonHistory}
          onClose={() => setShowHistoryModal(false)}
        />
      ) : null}
    </div>
  );
}
