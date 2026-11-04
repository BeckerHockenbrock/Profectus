"use client";

import { WorkspaceHero } from "@/components/shared/workspace-hero";
import { useMemo, useState } from "react";
import type React from "react";
import type { Quest, QuestView, Subtask } from "../types/quest";
import { groupQuestsByDate } from "../domain/date-utils";
import { sortCategoriesByStoredOrder } from "../data/quest-storage";
import { CategoryList } from "./category-list";
import { DateList } from "./date-list";
import { QuestList } from "./quest-list";
import { StoicQuote } from "./stoic-quote";

type TasksViewProps = {
  today: string;
  view: QuestView;
  onViewChange: (view: QuestView) => void;
  quests: Quest[];
  openQuests: Quest[];
  completedQuests: Quest[];
  savingQuestId: string | null;
  saveError: string;
  draggedId: string | null;
  getCardTransformY: (id: string, groupKey?: string) => number;
  handleCardPointerDown: (event: React.PointerEvent, questId: string, groupKey?: string) => void;
  suppressClickRef: React.MutableRefObject<boolean>;
  onToggleQuest: (id: string) => void;
  onSelectQuest: (quest: Quest) => void;
  onOpenNewQuest: () => void;
  onToggleSubtask?: (questId: string, subtaskId: string) => void;
  onOpenDatePicker?: (questId: string, currentDate: string, anchorRect: DOMRect) => void;
  onOpenSubtaskDatePicker?: (questId: string, subtaskId: string, currentDate: string, anchorRect: DOMRect) => void;
  onReorderSubtasks?: (questId: string, newSubtasks: Subtask[]) => void;
  categoryOrder?: string[];
  onReorderCategories?: (newCategories: string[]) => void;
};

export function TasksView({
  today,
  view,
  onViewChange,
  quests,
  openQuests,
  completedQuests,
  savingQuestId,
  saveError,
  draggedId,
  getCardTransformY,
  handleCardPointerDown,
  suppressClickRef,
  onToggleQuest,
  onSelectQuest,
  onOpenNewQuest,
  onToggleSubtask,
  onOpenDatePicker,
  onOpenSubtaskDatePicker,
  onReorderSubtasks,
  categoryOrder,
  onReorderCategories,
}: TasksViewProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const groupedQuests = useMemo(() => {
    const rawCategories = Array.from(new Set(quests.map((quest) => quest.category)));
    const categories = sortCategoriesByStoredOrder(rawCategories, categoryOrder);
    return categories.map((category) => ({
      category,
      quests: quests.filter((quest) => quest.category === category),
    }));
  }, [quests, categoryOrder]);

  const dateGroups = useMemo(() => groupQuestsByDate(quests, today), [quests, today]);

  return (
    <>
      <WorkspaceHero
        eyebrow="01 / THE EVERYDAY ASCENT"
        title="Make room for progress."
        description="A clear mind. A little intention. One quest at a time."
        image="/sisyphus.png"
      >
        <StoicQuote today={today} />
      </WorkspaceHero>

      <section className="workspaceMetrics" aria-label="Quest overview">
        <div><span>On your path</span><strong>{openQuests.length}<small>open quests</small></strong></div>
        <div><span>For today</span><strong>{openQuests.filter((quest) => quest.dueDate === today).length}<small>to work on</small></strong></div>
        <div><span>Steps taken</span><strong>{completedQuests.length}<small>completed</small></strong></div>
      </section>

      <section className="questSection" aria-labelledby="quest-heading">
        <div className="sectionHeading">
          <div className="sectionTitleGroup">
            <div><p className="sectionEyebrow">YOUR NEXT STEPS</p><h2 id="quest-heading">Quests</h2></div>
            <button
              type="button"
              className="sectionAddButton"
              onClick={onOpenNewQuest}
              aria-label="Create new quest"
              title="New quest"
            >
              <span aria-hidden="true">+</span>
              <span>New</span>
            </button>
          </div>

          <div className="viewSwitch" aria-label="Quest view">
            <button
              type="button"
              className={view === "dates" ? "isActive" : ""}
              aria-pressed={view === "dates"}
              onClick={() => onViewChange("dates")}
            >
              Dates
            </button>
            <button
              type="button"
              className={view === "all" ? "isActive" : ""}
              aria-pressed={view === "all"}
              onClick={() => onViewChange("all")}
            >
              All
            </button>
            <button
              type="button"
              className={view === "categories" ? "isActive" : ""}
              aria-pressed={view === "categories"}
              onClick={() => onViewChange("categories")}
            >
              Categories
            </button>
          </div>
        </div>

        {saveError ? <p className="formError" role="alert">{saveError}</p> : null}

        {view === "all" ? (
          <QuestList
            today={today}
            openQuests={openQuests}
            completedQuests={completedQuests}
            showCompleted={showCompleted}
            onToggleCompleted={() => setShowCompleted((previous) => !previous)}
            savingQuestId={savingQuestId}
            draggedId={draggedId}
            getCardTransformY={getCardTransformY}
            handleCardPointerDown={handleCardPointerDown}
            suppressClickRef={suppressClickRef}
            onToggleQuest={onToggleQuest}
            onSelectQuest={onSelectQuest}
            onToggleSubtask={onToggleSubtask}
            onOpenDatePicker={onOpenDatePicker}
            onOpenSubtaskDatePicker={onOpenSubtaskDatePicker}
            onReorderSubtasks={onReorderSubtasks}
          />
        ) : view === "categories" ? (
          <CategoryList
            groups={groupedQuests}
            expandedCategories={expandedCategories}
            onToggleCategory={(category) =>
              setExpandedCategories((previous) => ({
                ...previous,
                [category]: !previous[category],
              }))
            }
            today={today}
            savingQuestId={savingQuestId}
            draggedId={draggedId}
            getCardTransformY={getCardTransformY}
            handleCardPointerDown={handleCardPointerDown}
            suppressClickRef={suppressClickRef}
            onToggleQuest={onToggleQuest}
            onSelectQuest={onSelectQuest}
            onToggleSubtask={onToggleSubtask}
            onOpenDatePicker={onOpenDatePicker}
            onOpenSubtaskDatePicker={onOpenSubtaskDatePicker}
            onReorderSubtasks={onReorderSubtasks}
            onReorderCategories={onReorderCategories}
          />
        ) : (
          <DateList
            groups={dateGroups}
            expandedDates={expandedDates}
            onToggleDate={(dateKey) =>
              setExpandedDates((previous) => ({
                ...previous,
                [dateKey]: !previous[dateKey],
              }))
            }
            today={today}
            savingQuestId={savingQuestId}
            draggedId={draggedId}
            getCardTransformY={getCardTransformY}
            handleCardPointerDown={handleCardPointerDown}
            suppressClickRef={suppressClickRef}
            onToggleQuest={onToggleQuest}
            onSelectQuest={onSelectQuest}
            onToggleSubtask={onToggleSubtask}
            onOpenDatePicker={onOpenDatePicker}
            onOpenSubtaskDatePicker={onOpenSubtaskDatePicker}
            onReorderSubtasks={onReorderSubtasks}
          />
        )}
      </section>
    </>
  );
}
