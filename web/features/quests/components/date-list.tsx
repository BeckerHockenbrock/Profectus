import type React from "react";
import type { Quest } from "../types/quest";
import type { DateQuestGroup } from "../domain/date-utils";
import { QuestCard } from "./quest-card";

type DateListProps = {
  groups: DateQuestGroup[];
  expandedDates: Record<string, boolean>;
  onToggleDate: (dateKey: string) => void;
  today: string;
  savingQuestId: string | null;
  draggedId?: string | null;
  getCardTransformY?: (id: string, groupKey?: string) => number;
  handleCardPointerDown?: (event: React.PointerEvent, questId: string, isHandle?: boolean, groupKey?: string) => void;
  suppressClickRef: React.MutableRefObject<boolean>;
  onToggleQuest: (id: string) => void;
  onSelectQuest: (quest: Quest) => void;
  onToggleSubtask?: (questId: string, subtaskId: string) => void;
};

export function DateList({
  groups,
  expandedDates,
  onToggleDate,
  today,
  savingQuestId,
  draggedId,
  getCardTransformY,
  handleCardPointerDown,
  suppressClickRef,
  onToggleQuest,
  onSelectQuest,
  onToggleSubtask,
}: DateListProps) {
  const selectQuest = (quest: Quest) => {
    if (suppressClickRef.current) return;
    onSelectQuest(quest);
  };

  if (groups.length === 0) {
    return (
      <div className="questListContainer">
        <div className="questList">
          <p className="emptyState">Your path is clear. Add the first quest when you are ready.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="categoryList">
      {groups.map((group) => {
        const groupOpen = group.quests.filter((quest) => !quest.completed);
        const groupCompleted = group.quests.filter((quest) => quest.completed);
        const isGroupExpanded = expandedDates[group.dateKey] ?? false;

        return (
          <section className="categoryGroup" key={group.dateKey || "__no_date__"}>
            <div className="categoryHeading">
              <h3>{group.title}</h3>
              <span>{groupOpen.length}</span>
            </div>

            <div className="questList">
              {groupOpen.length === 0 && groupCompleted.length === 0 ? (
                <p className="emptyStateCategory">No quests for this date.</p>
              ) : groupOpen.length === 0 ? (
                <p className="emptyStateCategory">All quests for this date completed.</p>
              ) : (
                groupOpen.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    today={today}
                    onToggle={onToggleQuest}
                    onSelect={selectQuest}
                    isUpdating={savingQuestId === quest.id}
                    isDragging={draggedId === quest.id}
                    transformY={getCardTransformY ? getCardTransformY(quest.id, group.dateKey) : 0}
                    onPointerDown={
                      handleCardPointerDown
                        ? (e, qId, isH) => handleCardPointerDown(e, qId, isH, group.dateKey)
                        : undefined
                    }
                    onToggleSubtask={onToggleSubtask}
                  />
                ))
              )}
            </div>

            {groupCompleted.length > 0 ? (
              <div className="completedSection categoryCompletedSection">
                <button
                  type="button"
                  className="completedToggle"
                  onClick={() => onToggleDate(group.dateKey)}
                  aria-expanded={isGroupExpanded}
                >
                  <span>Completed ({groupCompleted.length})</span>
                  <svg
                    className={`completedChevron ${isGroupExpanded ? "isOpen" : ""}`}
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

                {isGroupExpanded ? (
                  <div className="questList completedQuestList">
                    {groupCompleted.map((quest) => (
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
          </section>
        );
      })}
    </div>
  );
}
