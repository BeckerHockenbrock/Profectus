import type { SeasonHistoryItem } from "../types/stats";
import { RANK_TIERS } from "../types/stats";
import { calculateRankFromRR } from "../domain/rank-math";
import { RankBadge } from "./rank-badge";

type HistoryModalProps = {
  history: SeasonHistoryItem[];
  onClose: () => void;
};

export function HistoryModal({ history, onClose }: HistoryModalProps) {
  return (
    <div className="historyModalOverlay" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <div className="historyModalCard">
        <div className="historyModalHeader">
          <h3 id="history-modal-title">Past Acts & Seasons</h3>
          <button
            type="button"
            className="historyModalClose"
            onClick={onClose}
            aria-label="Close past acts"
          >
            ✕
          </button>
        </div>

        <div className="historyModalList">
          {history.length === 0 ? (
            <p className="historyEmptyText">No previous acts recorded yet. Complete this month to earn your first Act badge!</p>
          ) : (
            history.map((item, index) => {
              const finalPosition = calculateRankFromRR(
                (RANK_TIERS.find((tier) => tier.tier === item.finalTier)?.minCumulativeRR || 0) +
                  (item.finalDivision - 1) * 100 +
                  item.finalRR,
              );

              return (
                <div key={index} className="historyActCard">
                  <RankBadge tier={item.finalTier} division={item.finalDivision} size={48} />
                  <div className="historyActDetails">
                    <h4>{item.seasonName}</h4>
                    <p className="historyActRank">
                      Finish: <strong style={{ color: finalPosition.tierMeta.accentColor }}>{finalPosition.label}</strong>
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
  );
}
