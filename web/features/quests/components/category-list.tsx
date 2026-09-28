import { useMemo } from "react";
import type { Quest, Subtask } from "../types/quest";
import { QuestCard } from "./quest-card";
import { useCategoryReorder } from "../hooks/use-category-reorder";

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
  handleCardPointerDown?: (event: React.PointerEvent, questId: string, groupKey?: string) => void;
  suppressClickRef: React.MutableRefObject<boolean>;
  onToggleQuest: (id: string) => void;
  onSelectQuest: (quest: Quest) => void;
  onToggleSubtask?: (questId: string, subtaskId: string) => void;
  onOpenDatePicker?: (questId: string, currentDate: string, anchorRect: DOMRect) => void;
  onOpenSubtaskDatePicker?: (questId: string, subtaskId: string, currentDate: string, anchorRect: DOMRect) => void;
  onReorderSubtasks?: (questId: string, newSubtasks: Subtask[]) => void;
  onReorderCategories?: (newCategories: string[]) => void;
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
  onReorderSubtasks,
  onReorderCategories,
}: CategoryListProps) {
  const categoryNames = useMemo(() => groups.map((g) => g.category), [groups]);

  const {
    draggedCategory,
    handleCategoryPointerDown,
    handleCategoryKeyDown,
    getCategoryTransformY,
  } = useCategoryReorder({
    categories: categoryNames,
    onReorder: onReorderCategories,
  });

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
      {groups.map((group, index) => {
        const groupOpen = group.quests.filter((quest) => !quest.completed);
        const groupCompleted = group.quests.filter((quest) => quest.completed);
        const isGroupExpanded = expandedCategories[group.category] ?? false;
        const isThisCategoryDragging = draggedCategory === group.category;
        const categoryTransformY = getCategoryTransformY(group.category);

        return (
          <section
            className="categoryGroup"
            key={group.category}
            data-category={group.category}
            data-dragging={isThisCategoryDragging ? "true" : undefined}
            style={{
              transform: isThisCategoryDragging
                ? `translateY(${categoryTransformY}px) scale(1.015)`
                : categoryTransformY !== 0
                  ? `translateY(${categoryTransformY}px)`
                  : undefined,
              zIndex: isThisCategoryDragging ? 70 : undefined,
              transition: isThisCategoryDragging
                ? "none"
                : "transform 220ms cubic-bezier(0.2, 0.9, 0.3, 1)",
              position: "relative",
              boxShadow: isThisCategoryDragging
                ? "0 16px 36px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.12)"
                : undefined,
              borderRadius: isThisCategoryDragging ? "0.75rem" : undefined,
              background: isThisCategoryDragging ? "rgba(22, 23, 27, 0.96)" : undefined,
            }}
          >
            <div
              className="categoryHeading"
              onPointerDown={
                groups.length > 1
                  ? (e) => handleCategoryPointerDown(e, group.category)
                  : undefined
              }
              onKeyDown={
                groups.length > 1
                  ? (e) => handleCategoryKeyDown(e, group.category)
                  : undefined
              }
              tabIndex={groups.length > 1 ? 0 : undefined}
              role={groups.length > 1 ? "button" : undefined}
              title={groups.length > 1 ? "Press and hold or use Alt+Up/Down arrow to reorder category" : undefined}
              aria-label={
                groups.length > 1
                  ? `${group.category} category, position ${index + 1} of ${groups.length}. Press and hold or use Alt+Up/Down arrow to reorder`
                  : `${group.category} category`
              }
              style={{
                cursor: groups.length > 1 ? (isThisCategoryDragging ? "grabbing" : "grab") : undefined,
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: groups.length > 1 ? "pan-y" : undefined,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                {groups.length > 1 ? (
                  <span
                    className="categoryDragGrip"
                    aria-hidden="true"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.38,
                      cursor: "grab",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="6" r="1.6" />
                      <circle cx="15" cy="6" r="1.6" />
                      <circle cx="9" cy="12" r="1.6" />
                      <circle cx="15" cy="12" r="1.6" />
                      <circle cx="9" cy="18" r="1.6" />
                      <circle cx="15" cy="18" r="1.6" />
                    </svg>
                  </span>
                ) : null}
                <h3>{group.category}</h3>
              </div>
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
                        ? (e, qId) => handleCardPointerDown(e, qId, group.category)
                        : undefined
                    }
                    onToggleSubtask={onToggleSubtask}
                    onOpenDatePicker={onOpenDatePicker}
                    onOpenSubtaskDatePicker={onOpenSubtaskDatePicker}
                    onReorderSubtasks={onReorderSubtasks}
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
