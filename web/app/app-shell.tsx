"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AppHeader } from "@/components/navigation/app-header";
import { LiquidDock } from "@/components/navigation/liquid-dock";
import { HomeScreenHint } from "@/components/shared/home-screen-hint";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { useAuthUser } from "@/features/auth/hooks/use-auth-user";
import { FocusScreen } from "@/features/focus/components/focus-screen";
import { QuestFormModal } from "@/features/quests/components/quest-form-modal";
import { TaskDetailModal } from "@/features/quests/components/task-detail-modal";
import { TasksView } from "@/features/quests/components/tasks-view";
import { useQuestMutations } from "@/features/quests/hooks/use-quest-mutations";
import { useQuestReorder } from "@/features/quests/hooks/use-quest-reorder";
import { useQuestSubscription } from "@/features/quests/hooks/use-quest-subscription";
import type { Quest, QuestForm, QuestView } from "@/features/quests/types/quest";
import { SchoolView } from "@/features/school/components/school-view";
import { StatsView } from "@/features/stats/components/stats-view";
import { useAppNavigation } from "./use-app-navigation";
import type { ActiveTab } from "./use-app-navigation";

type AppShellProps = {
  today: string;
};

const emptyForm: QuestForm = {
  title: "",
  description: "",
  category: "",
  dueDate: "",
};

export function AppShell({ today }: AppShellProps) {
  const { user, authError, signIn, signOut } = useAuthUser();
  const [activeTab, setActiveTab] = useState<ActiveTab>("tasks");
  const [questView, setQuestView] = useState<QuestView>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestForm>(emptyForm);
  const [focusQuest, setFocusQuest] = useState<Quest | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [showHomeScreenHint, setShowHomeScreenHint] = useState(false);

  const { quests, setQuests, loadError } = useQuestSubscription(user?.uid);
  const {
    savingQuestId,
    isCreating,
    mutationError,
    setMutationError,
    toggleQuest,
    createQuest,
    updateQuest,
    deleteQuest,
    finishFocusSession,
  } = useQuestMutations({
    userId: user?.uid,
    quests,
    setQuests,
  });

  const openQuests = useMemo(() => quests.filter((quest) => !quest.completed), [quests]);
  const completedQuests = useMemo(() => quests.filter((quest) => quest.completed), [quests]);
  const categories = useMemo(
    () => Array.from(new Set(["General", ...quests.map((quest) => quest.category)])).sort(),
    [quests],
  );

  const {
    draggedId,
    suppressClickRef,
    handleCardPointerDown,
    getCardTransformY,
  } = useQuestReorder({
    userId: user?.uid,
    quests,
    openQuests,
    setQuests,
  });

  const {
    handleHomeNavigation,
    handleSchoolNavigation,
    handleStatsNavigation,
  } = useAppNavigation({
    activeTab,
    sheetOpen,
    setActiveTab,
    setSheetOpen,
    setQuestView,
  });

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

  const handleFocusFinished = async (questId: string, addedMinutes: number) => {
    await finishFocusSession(questId, addedMinutes);
    setFocusQuest(null);
    setSelectedQuestId(null);
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = editingQuestId
      ? await updateQuest(editingQuestId, form)
      : await createQuest(form);
    if (success) {
      setForm(emptyForm);
      setEditingQuestId(null);
      setSheetOpen(false);
    }
  };

  const openNewQuest = () => {
    setMutationError("");
    setEditingQuestId(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openQuestEditor = (quest: Quest) => {
    setMutationError("");
    setSelectedQuestId(null);
    setEditingQuestId(quest.id);
    setForm({
      title: quest.title,
      description: quest.description,
      category: quest.category,
      dueDate: quest.dueDate,
    });
    setSheetOpen(true);
  };

  const closeQuestForm = () => {
    setSheetOpen(false);
    setEditingQuestId(null);
  };

  const handleDeleteQuest = async (id: string) => {
    if (!window.confirm("Delete this quest? This cannot be undone.")) return;
    await deleteQuest(id);
  };

  if (user === undefined) {
    return <AuthShell isLoading />;
  }

  if (!user) {
    return (
      <AuthShell
        authError={authError}
        showHomeScreenHint={showHomeScreenHint}
        onSignIn={signIn}
        onDismissHomeScreenHint={dismissHomeScreenHint}
      />
    );
  }

  const selectedQuest = selectedQuestId
    ? quests.find((quest) => quest.id === selectedQuestId) ?? null
    : null;
  const activeFocusQuest = focusQuest
    ? quests.find((quest) => quest.id === focusQuest.id) ?? focusQuest
    : null;
  const displayError = mutationError || loadError;
  const userInitial = (user.displayName ?? user.email ?? "U").slice(0, 1).toUpperCase();

  return (
    <>
      <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
        <defs>
          <filter id="pencil-stroke">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {activeFocusQuest ? (
        <FocusScreen
          quest={activeFocusQuest}
          onQuit={() => setFocusQuest(null)}
          onFinish={handleFocusFinished}
        />
      ) : (
        <main className="appShell">
          <AppHeader
            activeTab={activeTab}
            userInitial={userInitial}
            onOpenNewQuest={openNewQuest}
            onSignOut={signOut}
          />

          {authError ? <p className="formError" role="alert">{authError}</p> : null}

          {activeTab === "school" ? (
            <div className="content" id="top">
              <SchoolView userId={user.uid} />
            </div>
          ) : activeTab === "stats" ? (
            <div className="content" id="top">
              <StatsView key={user.uid} userId={user.uid} quests={quests} />
            </div>
          ) : (
            <div className="content" id="top">
              {showHomeScreenHint ? <HomeScreenHint onDismiss={dismissHomeScreenHint} /> : null}
              <TasksView
                today={today}
                view={questView}
                onViewChange={setQuestView}
                quests={quests}
                openQuests={openQuests}
                completedQuests={completedQuests}
                savingQuestId={savingQuestId}
                saveError={displayError}
                draggedId={draggedId}
                getCardTransformY={getCardTransformY}
                handleCardPointerDown={handleCardPointerDown}
                suppressClickRef={suppressClickRef}
                onToggleQuest={toggleQuest}
                onSelectQuest={(targetQuest) => setSelectedQuestId(targetQuest.id)}
            onOpenNewQuest={openNewQuest}
              />
            </div>
          )}

          <QuestFormModal
            sheetOpen={sheetOpen}
            editingQuestId={editingQuestId}
            form={form}
            setForm={setForm}
            categories={categories}
            isSaving={isCreating || savingQuestId !== null}
            formError={mutationError}
            onClose={closeQuestForm}
            onSubmit={handleFormSubmit}
          />

          {selectedQuest ? (
            <TaskDetailModal
              quest={selectedQuest}
              today={today}
              onClose={() => setSelectedQuestId(null)}
              onEdit={() => openQuestEditor(selectedQuest)}
              onDelete={() => handleDeleteQuest(selectedQuest.id)}
              onToggleComplete={toggleQuest}
              onStartFocus={(targetQuest) => {
                setSelectedQuestId(null);
                setFocusQuest(targetQuest);
              }}
              isUpdating={savingQuestId === selectedQuest.id}
            />
          ) : null}

          <LiquidDock
            activeTab={activeTab}
            onNavigateHome={handleHomeNavigation}
            onNavigateSchool={handleSchoolNavigation}
            onNavigateStats={handleStatsNavigation}
          />
        </main>
      )}
    </>
  );
}
