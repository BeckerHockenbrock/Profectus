"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type React from "react";
import type { Quest, QuestView } from "../types/quest";
import { groupQuestsByDate } from "../domain/date-utils";
import { CategoryList } from "./category-list";
import { DateList } from "./date-list";
import { QuestList } from "./quest-list";

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
  getCardTransformY: (id: string) => number;
  handleCardPointerDown: (event: React.PointerEvent, questId: string, isHandle?: boolean) => void;
  suppressClickRef: React.MutableRefObject<boolean>;
  onToggleQuest: (id: string) => void;
  onSelectQuest: (quest: Quest) => void;
  onOpenNewQuest: () => void;
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
}: TasksViewProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const groupedQuests = useMemo(() => {
    const categories = Array.from(new Set(quests.map((quest) => quest.category))).sort();
    return categories.map((category) => ({
      category,
      quests: quests.filter((quest) => quest.category === category),
    }));
  }, [quests]);

  const dateGroups = useMemo(() => groupQuestsByDate(quests, today), [quests, today]);

  return (
    <>
      <section className="hero" aria-label="Todo Quest">
        <Image
          className="heroLogo"
          src="/sisyphus.png"
          alt="Sisyphus carrying a boulder"
          width={1152}
          height={1366}
          sizes="(max-width: 48rem) 70vw, 18rem"
          preload
          unoptimized
        />
        <p className="heroTitle">Todo Quest</p>
      </section>

      <section className="questSection" aria-labelledby="quest-heading">
        <div className="sectionHeading">
          <div className="sectionTitleGroup">
            <h2 id="quest-heading">Quests</h2>
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
            suppressClickRef={suppressClickRef}
            onToggleQuest={onToggleQuest}
            onSelectQuest={onSelectQuest}
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
            suppressClickRef={suppressClickRef}
            onToggleQuest={onToggleQuest}
            onSelectQuest={onSelectQuest}
          />
        )}
      </section>
    </>
  );
}
