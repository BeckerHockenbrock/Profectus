"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import type { Quest } from "@/lib/quest-types";

type QuestAppProps = {
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

function HomeScreenHint({ onDismiss }: { onDismiss: () => void }) {
  return (
    <aside className="homeScreenHint" aria-label="Add Todo Quest to your home screen">
      <div>
        <strong>Use Todo Quest like an app</strong>
        <p>Open your browser menu, then choose <b>Share</b> and <b>Add to Home Screen</b>.</p>
      </div>
      <button className="hintDismissButton" type="button" onClick={onDismiss} aria-label="Dismiss home screen hint">
        Not now
      </button>
    </aside>
  );
}

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

function QuestCard({
  quest,
  today,
  onToggle,
  isUpdating,
}: {
  quest: Quest;
  today: string;
  onToggle: (id: string) => void;
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

export default function QuestApp({ today }: QuestAppProps) {
  const firebaseConfigured = isFirebaseConfigured();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [user, setUser] = useState<User | null | undefined>(firebaseConfigured ? undefined : null);
  const [view, setView] = useState<"all" | "categories">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<QuestForm>(emptyForm);
  const [savingQuestId, setSavingQuestId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saveError, setSaveError] = useState(firebaseConfigured ? "" : "Firebase is not configured yet.");
  const [showHomeScreenHint, setShowHomeScreenHint] = useState(false);

  const openCount = quests.filter((quest) => !quest.completed).length;
  const completedCount = quests.length - openCount;
  const totalXP = quests.reduce((total, quest) => total + quest.focusMinutes, 0);
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

  useEffect(() => {
    if (!firebaseConfigured) {
      return;
    }

    let stopQuestSync: (() => void) | undefined;

    const auth = getFirebaseAuth();
    const database = getFirebaseDb();
    const stopAuthListener = onAuthStateChanged(auth, (nextUser) => {
      stopQuestSync?.();
      setUser(nextUser);

      if (!nextUser) {
        setQuests([]);
        return;
      }

      const questQuery = query(
        collection(database, "users", nextUser.uid, "quests"),
        orderBy("createdAt", "desc"),
      );

      stopQuestSync = onSnapshot(
        questQuery,
        (snapshot) => {
          setQuests(
            snapshot.docs.map((quest) => {
              const data = quest.data();
              return {
                id: quest.id,
                title: String(data.title ?? ""),
                description: String(data.description ?? ""),
                category: String(data.category ?? "General"),
                dueDate: String(data.dueDate ?? ""),
                completed: Boolean(data.completed),
                focusMinutes: Number(data.focusMinutes ?? 0),
              };
            }),
          );
        },
        () => setSaveError("Your quests could not be loaded. Try refreshing."),
      );
    });

    return () => {
      stopQuestSync?.();
      stopAuthListener();
    };
  }, [firebaseConfigured]);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;

    if (isIOS && !isStandalone && localStorage.getItem("todo-quest-home-screen-hint-dismissed") !== "true") {
      const animationFrame = requestAnimationFrame(() => setShowHomeScreenHint(true));
      return () => cancelAnimationFrame(animationFrame);
    }
  }, []);

  function dismissHomeScreenHint() {
    localStorage.setItem("todo-quest-home-screen-hint-dismissed", "true");
    setShowHomeScreenHint(false);
  }

  async function toggleQuest(id: string) {
    const quest = quests.find((current) => current.id === id);

    if (!quest || !user || savingQuestId !== null) {
      return;
    }

    const completed = !quest.completed;
    setSaveError("");
    setSavingQuestId(id);
    setQuests((current) => current.map((item) => (item.id === id ? { ...item, completed } : item)));

    try {
      await updateDoc(doc(getFirebaseDb(), "users", user.uid, "quests", id), { completed });
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

    if (!title || !category || !user || isCreating) return;

    setSaveError("");
    setIsCreating(true);

    try {
      await addDoc(collection(getFirebaseDb(), "users", user.uid, "quests"), {
        title,
        description: form.description.trim(),
        category,
        dueDate: form.dueDate,
        completed: false,
        focusMinutes: 0,
        createdAt: Date.now(),
      });
      setForm(emptyForm);
      closeSheet();
    } catch {
      setSaveError("That quest did not save. Try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function startSignIn() {
    setSaveError("");

    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    } catch {
      setSaveError("Google sign-in did not start. Try again.");
    }
  }

  async function signOutUser() {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      setSaveError("Could not sign out. Try again.");
    }
  }

  if (user === undefined) {
    return <main className="authShell">Loading your quests…</main>;
  }

  if (!user) {
    return (
      <main className="authShell">
        <section className="authCard" aria-labelledby="sign-in-heading">
          <Image src="/sisyphus.png" alt="Sisyphus carrying a boulder" width={120} height={142} priority />
          <p className="heroTitle">Todo Quest</p>
          <h1 id="sign-in-heading">Your quests, wherever you are.</h1>
          <p>Sign in with Google to keep this account&apos;s quests synced across your devices.</p>
          {saveError ? <p className="formError" role="alert">{saveError}</p> : null}
          <button className="signInButton" type="button" onClick={startSignIn}>
            Continue with Google
          </button>
          {showHomeScreenHint ? <HomeScreenHint onDismiss={dismissHomeScreenHint} /> : null}
        </section>
      </main>
    );
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
        </a>
        <button className="profileButton" type="button" onClick={signOutUser} title="Sign out" aria-label="Sign out">
          {(user.displayName ?? user.email ?? "U").slice(0, 1).toUpperCase()}
        </button>
      </header>

      <div className="content" id="top">
        {showHomeScreenHint ? <HomeScreenHint onDismiss={dismissHomeScreenHint} /> : null}
        <section className="hero" aria-label="Todo Quest">
          <Image
            className="heroLogo"
            src="/sisyphus.png"
            alt="Sisyphus carrying a boulder"
            width={1152}
            height={1366}
            sizes="(max-width: 48rem) 70vw, 18rem"
            preload
          />
          <p className="heroTitle">Todo Quest</p>
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
            <h2 id="quest-heading">Quests</h2>

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
