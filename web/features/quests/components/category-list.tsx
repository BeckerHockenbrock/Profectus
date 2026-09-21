import type React from "react";
import type { Quest } from "../types/quest";
import { QuestCard } from "./quest-card";

type QuestGroup = {
  category: string;
  quests: Quest[];
};

type CategoryListProps = {
  groups: QuestGroup[];
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (category: string) => void;
  today: string;
  savingQuestId: string | null;
  draggedId?: string | null;
  getCardTransformY?: (id: string, groupKey?: string) => number;
  handleCardPointerDown?: (event: React.PointerEvent, questId: string, isHandle?: boolean, groupKey?: string) => void;
  suppressClickRef: React.MutableRefObject<boolean>;
  onToggleQuest: (id: string) => void;
  onSelectQuest: (quest: Quest) => void;
  onToggleSubtask?: (questId: string, subtaskId: string) => void;
  onOpenDatePicker?: (questId: string, currentDate: string, anchorRect: DOMRect) => void;
  onOpenSubtaskDatePicker?: (questId: string, subtaskId: string, currentDate: string, anchorRect: DOMRect) => void;
};

export function CategoryList({
  groups,
  expandedCategories,
  onToggleCategory,
  today,
  savingQuestId,
  draggedId,
  getCardTransformY,
  handleCardPointerDown,
  suppressClickRef,
  onToggleQuest,
  onSelectQuest,
  onToggleSubtask,
  onOpenDatePicker,
  onOpenSubtaskDatePicker,
}: CategoryListProps) {
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
        const isGroupExpanded = expandedCategories[group.category] ?? false;

        return (
          <section className="categoryGroup" key={group.category}>
            <div className="categoryHeading">
              <h3>{group.category}</h3>
              <span>{groupOpen.length}</span>
            </div>

            <div className="questList">
              {groupOpen.length === 0 && groupCompleted.length === 0 ? (
                <p className="emptyStateCategory">No quests in this category.</p>
              ) : groupOpen.length === 0 ? (
                <p className="emptyStateCategory">All quests in this category completed.</p>
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
                    transformY={getCardTransformY ? getCardTransformY(quest.id, group.category) : 0}
                    onPointerDown={
                      handleCardPointerDown
                        ? (e, qId, isH) => handleCardPointerDown(e, qId, isH, group.category)
                        : undefined
                    }
                    onToggleSubtask={onToggleSubtask}
                    onOpenDatePicker={onOpenDatePicker}
                    onOpenSubtaskDatePicker={onOpenSubtaskDatePicker}
                  />
                ))
              )}
            </div>

            {groupCompleted.length > 0 ? (
              <div className="completedSection categoryCompletedSection">
                <button
                  type="button"
                  className="completedToggle"
                  onClick={() => onToggleCategory(group.category)}
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
                        onOpenDatePicker={onOpenDatePicker}
                        onOpenSubtaskDatePicker={onOpenSubtaskDatePicker}
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
