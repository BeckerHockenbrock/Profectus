"use client";

import Image from "next/image";
import type { CSSProperties, FormEvent } from "react";
import { useMemo, useState } from "react";
import type { Quest } from "@/lib/quest-types";

type QuestAppProps = {
  initialQuests: Quest[];
  today: string;
};

type QuestForm = {
  title: string;
  description: string;
  category: string;
  dueDate: string;
};

const emptyForm: QuestForm = {
  title: "",
  description: "",
  category: "",
  dueDate: "",
};

function addDays(isoDate: string, daysToAdd: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day + daysToAdd);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function formatDueDate(dueDate: string, today: string) {
  if (!dueDate) return "No date";
  if (dueDate === today) return "Today";
  if (dueDate === addDays(today, 1)) return "Tmrw";

  const [year, month, day] = dueDate.split("-");
  const currentYear = today.slice(0, 4);
  return year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;
}

function formatWeekday(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(date);
}

function QuestCard({
  quest,
  today,
  onToggle,
  isUpdating,
}: {
  quest: Quest;
  today: string;
  onToggle: (id: number) => void;
  isUpdating: boolean;
}) {
  return (
    <article className={`questCard${quest.completed ? " isComplete" : ""}`}>
      <button
        className="completeButton"
        type="button"
        aria-label={quest.completed ? `Reopen ${quest.title}` : `Complete ${quest.title}`}
        aria-pressed={quest.completed}
        onClick={() => onToggle(quest.id)}
        disabled={isUpdating}
      >
        <span aria-hidden="true">{quest.completed ? "✓" : ""}</span>
      </button>

      <div className="questContent">
        <div className="questMeta">
          <span className="categoryPill">{quest.category}</span>
          <span className={quest.dueDate === today ? "dueLabel isToday" : "dueLabel"}>
            {formatDueDate(quest.dueDate, today)}
          </span>
        </div>
        <h3>{quest.title}</h3>
        {quest.description ? <p>{quest.description}</p> : null}
        <div className="questReward" aria-label={`${quest.focusMinutes} minutes focused`}>
          <span>{quest.focusMinutes} min focused</span>
          <span aria-hidden="true">·</span>
          <strong>{quest.focusMinutes} XP</strong>
        </div>
      </div>
    </article>
  );
}

export default function QuestApp({ initialQuests, today }: QuestAppProps) {
  const [quests, setQuests] = useState(initialQuests);
  const [view, setView] = useState<"all" | "categories">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<QuestForm>(emptyForm);
  const [savingQuestId, setSavingQuestId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saveError, setSaveError] = useState("");

  const openCount = quests.filter((quest) => !quest.completed).length;
  const completedCount = quests.length - openCount;
  const totalXP = quests.reduce((total, quest) => total + quest.focusMinutes, 0);
  const completionPercent = quests.length === 0 ? 0 : (completedCount / quests.length) * 100;

  const groupedQuests = useMemo(() => {
    const categories = Array.from(new Set(quests.map((quest) => quest.category))).sort();
    return categories.map((category) => ({
      category,
      quests: quests.filter((quest) => quest.category === category),
    }));
  }, [quests]);

  const categories = useMemo(
    () => Array.from(new Set(quests.map((quest) => quest.category))).sort(),
    [quests],
  );

  async function toggleQuest(id: number) {
    const quest = quests.find((current) => current.id === id);

    if (!quest || savingQuestId !== null) {
      return;
    }

    const completed = !quest.completed;
    setSaveError("");
    setSavingQuestId(id);
    setQuests((current) => current.map((item) => (item.id === id ? { ...item, completed } : item)));

    try {
      const response = await fetch(`/api/quests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });

      if (!response.ok) {
        throw new Error("Quest update failed");
      }

      const savedQuest = (await response.json()) as Quest;
      setQuests((current) => current.map((item) => (item.id === id ? savedQuest : item)));
    } catch {
      setQuests((current) => current.map((item) => (item.id === id ? quest : item)));
      setSaveError("That change did not save. Try again.");
    } finally {
      setSavingQuestId(null);
    }
  }

  function closeSheet() {
    setSheetOpen(false);
  }

  async function submitQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const category = form.category.trim();

    if (!title || !category || isCreating) return;

    setSaveError("");
    setIsCreating(true);

    try {
      const response = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: form.description.trim(),
          category,
          dueDate: form.dueDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Quest creation failed");
      }

      const savedQuest = (await response.json()) as Quest;
      setQuests((current) => [savedQuest, ...current]);
      setForm(emptyForm);
      closeSheet();
    } catch {
      setSaveError("That quest did not save. Try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <a className="brand" href="#top" aria-label="Todo Quest home">
          <Image
            className="brandLogo"
            src="/sisyphus.png"
            alt=""
            width={40}
            height={40}
            preload
          />
          Todo Quest
        </a>
        <div className="profileButton" aria-label="Local profile">
          B
        </div>
      </header>

      <div className="content" id="top">
        <section className="hero" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">{formatWeekday(today)} · Your quest log</p>
            <h1 id="page-title">Make today count.</h1>
            <p className="heroCopy">Choose what deserves your focus, then move one quest forward.</p>
          </div>

          <div
            className="progressOrb"
            aria-label={`${completedCount} of ${quests.length} quests complete`}
            style={{ "--quest-progress": `${completionPercent}%` } as CSSProperties}
          >
            <div className="progressOrbInner">
              <strong>{openCount}</strong>
              <span>open</span>
            </div>
          </div>
        </section>

        <section className="statStrip" aria-label="Daily progress">
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
          <div>
            <span>Focus XP</span>
            <strong>{totalXP}</strong>
          </div>
          <div>
            <span>Categories</span>
            <strong>{groupedQuests.length}</strong>
          </div>
        </section>

        <section className="questSection" aria-labelledby="quest-heading">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">In progress</p>
              <h2 id="quest-heading">Quests</h2>
            </div>

            <div className="viewSwitch" aria-label="Quest view">
              <button
                type="button"
                className={view === "all" ? "isActive" : ""}
                aria-pressed={view === "all"}
                onClick={() => setView("all")}
              >
                All
              </button>
              <button
                type="button"
                className={view === "categories" ? "isActive" : ""}
                aria-pressed={view === "categories"}
                onClick={() => setView("categories")}
              >
                Categories
              </button>
            </div>
          </div>

          {saveError ? <p className="formError" role="alert">{saveError}</p> : null}

          {view === "all" ? (
            <div className="questList">
              {quests.length === 0 ? (
                <p className="emptyState">Your path is clear. Add the first quest when you are ready.</p>
              ) : (
                quests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    today={today}
                    onToggle={toggleQuest}
                    isUpdating={savingQuestId === quest.id}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="categoryList">
              {groupedQuests.map((group) => (
                <section className="categoryGroup" key={group.category}>
                  <div className="categoryHeading">
                    <h3>{group.category}</h3>
                    <span>{group.quests.length}</span>
                  </div>
                  <div className="questList">
                    {group.quests.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        today={today}
                        onToggle={toggleQuest}
                        isUpdating={savingQuestId === quest.id}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>

      <button className="addButton" type="button" onClick={() => setSheetOpen(true)}>
        <span aria-hidden="true">+</span>
        <span>New quest</span>
      </button>

      <div
        className="sheetLayer"
        data-open={sheetOpen}
        aria-hidden={!sheetOpen}
        inert={!sheetOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape") closeSheet();
        }}
      >
        <button className="sheetScrim" type="button" aria-label="Close new quest form" onClick={closeSheet} />
        <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <div className="sheetHandle" aria-hidden="true" />
          <div className="sheetHeading">
            <div>
              <p className="eyebrow">Add to your path</p>
              <h2 id="sheet-title">New quest</h2>
            </div>
            <button className="closeButton" type="button" onClick={closeSheet} aria-label="Close">
              ×
            </button>
          </div>

          <form onSubmit={submitQuest}>
            <label>
              Quest title
              <input
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="What needs to move forward?"
              />
            </label>

            <label>
              Category
              <input
                required
                list="categories"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                placeholder="CIS 25, Work, College…"
              />
              <datalist id="categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>

            <label>
              Description <span>Optional</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="A clear next step or a useful note"
              />
            </label>

            <label>
              Due date <span>Optional</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
              />
            </label>

            <button className="saveButton" type="submit" disabled={isCreating}>
              {isCreating ? "Saving…" : "Create quest"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
