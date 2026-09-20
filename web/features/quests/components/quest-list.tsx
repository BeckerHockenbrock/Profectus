import type React from "react";
import type { Quest } from "../types/quest";
import { QuestCard } from "./quest-card";

type QuestListProps = {
  today: string;
  openQuests: Quest[];
  completedQuests: Quest[];
  showCompleted: boolean;
  onToggleCompleted: () => void;
  savingQuestId: string | null;
  draggedId: string | null;
  getCardTransformY: (id: string) => number;
  handleCardPointerDown: (event: React.PointerEvent, questId: string, isHandle?: boolean) => void;
  suppressClickRef: React.MutableRefObject<boolean>;
  onToggleQuest: (id: string) => void;
  onSelectQuest: (quest: Quest) => void;
  onToggleSubtask?: (questId: string, subtaskId: string) => void;
};

export function QuestList({
  today,
  openQuests,
  completedQuests,
  showCompleted,
  onToggleCompleted,
  savingQuestId,
  draggedId,
  getCardTransformY,
  handleCardPointerDown,
  suppressClickRef,
  onToggleQuest,
  onSelectQuest,
  onToggleSubtask,
}: QuestListProps) {
  const selectQuest = (quest: Quest) => {
    if (suppressClickRef.current) return;
    onSelectQuest(quest);
  };

  return (
    <div className="questListContainer">
      <div className="questList">
        {openQuests.length === 0 && completedQuests.length === 0 ? (
          <p className="emptyState">Your path is clear. Add the first quest when you are ready.</p>
        ) : openQuests.length === 0 ? (
          <p className="emptyState">All active quests completed! Great work.</p>
        ) : (
          openQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              today={today}
              onToggle={onToggleQuest}
              onSelect={selectQuest}
              isUpdating={savingQuestId === quest.id}
              isDragging={draggedId === quest.id}
              transformY={getCardTransformY(quest.id)}
              onPointerDown={handleCardPointerDown}
              onToggleSubtask={onToggleSubtask}
            />
          ))
        )}
      </div>

      {completedQuests.length > 0 ? (
        <div className="completedSection">
          <button
            type="button"
            className="completedToggle"
            onClick={onToggleCompleted}
            aria-expanded={showCompleted}
          >
            <span>Completed ({completedQuests.length})</span>
            <svg
              className={`completedChevron ${showCompleted ? "isOpen" : ""}`}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showCompleted ? (
            <div className="questList completedQuestList">
              {completedQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  today={today}
                  onToggle={onToggleQuest}
                  onSelect={selectQuest}
                  isUpdating={savingQuestId === quest.id}
                  isDragging={false}
                  transformY={0}
                  onToggleSubtask={onToggleSubtask}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
