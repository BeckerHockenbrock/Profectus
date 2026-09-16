import type { Quest } from "@/features/quests/types/quest";
import type { LifeAttribute } from "../types/stats";
import { LIFE_ATTRIBUTES } from "../types/stats";

type AttributeDetailSheetProps = {
  attribute: LifeAttribute;
  quests: Quest[];
  onClose: () => void;
};

export function AttributeDetailSheet({
  attribute,
  quests,
  onClose,
}: AttributeDetailSheetProps) {
  const meta = LIFE_ATTRIBUTES[attribute];

  return (
    <section className="attrDetailSheet" aria-label="Attribute Details">
      <div className="attrDetailHeader">
        <div className="attrDetailTitleGroup">
          <span
            className="attrDetailDot"
            style={{ backgroundColor: meta.color }}
            aria-hidden="true"
          />
          <h3>{meta.name} Details</h3>
        </div>
        <button
          type="button"
          className="attrDetailClose"
          onClick={onClose}
          aria-label="Close details"
        >
          ✕
        </button>
      </div>
      <p className="attrDetailDesc">{meta.description}</p>

      <div className="attrDetailQuestsList">
        <h4>Mapped Quests ({quests.length})</h4>
        {quests.length === 0 ? (
          <p className="attrDetailEmpty">
            No active quests tagged for {meta.name}. Create or complete quests with keywords like:{" "}
            <em>{meta.keywords.slice(0, 4).join(", ")}</em>.
          </p>
        ) : (
          quests.map((quest) => (
            <div key={quest.id} className="attrQuestRow">
              <span className={`attrQuestCheck ${quest.completed ? "isDone" : ""}`}>
                {quest.completed ? "✓" : "○"}
              </span>
              <span className="attrQuestTitle">{quest.title}</span>
              {quest.focusMinutes > 0 ? (
                <span className="attrQuestXp">{quest.focusMinutes}m</span>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
