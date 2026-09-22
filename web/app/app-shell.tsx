"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AppHeader } from "@/components/navigation/app-header";
import { type AppTab, LiquidDock } from "@/components/navigation/liquid-dock";
import { HomeScreenHint } from "@/components/shared/home-screen-hint";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { useAuthUser } from "@/features/auth/hooks/use-auth-user";
import { FocusScreen } from "@/features/focus/components/focus-screen";
import { LockInView } from "@/features/focus/components/lock-in-view";
import { useLockInStats } from "@/features/focus/hooks/use-lock-in-stats";
import { QuestFormModal } from "@/features/quests/components/quest-form-modal";
import { TaskDetailModal } from "@/features/quests/components/task-detail-modal";
import { TasksView } from "@/features/quests/components/tasks-view";
import { IosDatePickerPopover } from "@/features/quests/components/ios-date-picker";
import { SchoolView } from "@/features/school/components/school-view";
import { useQuestMutations } from "@/features/quests/hooks/use-quest-mutations";
import { useQuestReorder } from "@/features/quests/hooks/use-quest-reorder";
import { useQuestSubscription } from "@/features/quests/hooks/use-quest-subscription";
import { getLocalTodayString } from "@/features/quests/domain/date-utils";
import type { Quest, QuestForm, QuestView } from "@/features/quests/types/quest";
import { useAppNavigation } from "./use-app-navigation";

type AppShellProps = {
  today?: string;
};

const emptyForm: QuestForm = {
  title: "",
  description: "",
  category: "",
  dueDate: "",
  subtasks: [],
};

export function AppShell({ today: initialToday }: AppShellProps) {
  const [today, setToday] = useState<string>(() => initialToday || getLocalTodayString());

  useEffect(() => {
    const updateToday = () => {
      const local = getLocalTodayString();
      setToday((previous) => (previous !== local ? local : previous));
    };

    updateToday();
    window.addEventListener("focus", updateToday);
    const interval = setInterval(updateToday, 30000);

    return () => {
      window.removeEventListener("focus", updateToday);
      clearInterval(interval);
    };
  }, []);

  const { user, authError, signIn, signOut } = useAuthUser();
  const [activeTab, setActiveTab] = useState<AppTab>("tasks");
  const [questView, setQuestView] = useState<QuestView>("dates");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestForm>(emptyForm);
  const [focusConfig, setFocusConfig] = useState<{
    quest: Quest | null;
    targetMinutes: number | null;
    initialBlocks?: number;
  } | null>(null);
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
    updateQuestDueDate,
    deleteQuest,
    toggleSubtask,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    finishFocusSession,
  } = useQuestMutations({
    userId: user?.uid,
    quests,
    setQuests,
  });

  const { logSession } = useLockInStats(user?.uid, today);

  const [listDatePickerTarget, setListDatePickerTarget] = useState<{
    questId: string;
    subtaskId?: string;
    currentDueDate: string;
    anchorRect: DOMRect;
  } | null>(null);

  const handleOpenListDatePicker = (questId: string, currentDate: string, anchorRect: DOMRect) => {
    setListDatePickerTarget({
      questId,
      currentDueDate: currentDate,
      anchorRect,
    });
  };

  const handleOpenListSubtaskDatePicker = (
    questId: string,
    subtaskId: string,
    currentDate: string,
    anchorRect: DOMRect,
  ) => {
    setListDatePickerTarget({
      questId,
      subtaskId,
      currentDueDate: currentDate,
      anchorRect,
    });
  };

  const handleSelectListDate = async (newDate: string) => {
    if (!listDatePickerTarget) return;
    const { questId, subtaskId } = listDatePickerTarget;
    if (subtaskId) {
      await updateSubtask(questId, subtaskId, { dueDate: newDate || undefined });
    } else {
      await updateQuestDueDate(questId, newDate);
    }
  };

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
    view: questView,
  });

  const {
    handleTasksNavigation,
    handleSchoolNavigation,
    handleFocusNavigation,
  } = useAppNavigation({
    sheetOpen,
    setSheetOpen,
    setActiveTab,
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

  const handleFocusFinished = async (
    addedMinutes: number,
    blocksCompleted: number,
    questId?: string,
  ) => {
    if (questId && addedMinutes > 0) {
      await finishFocusSession(questId, addedMinutes);
    }
    const targetQuest = questId ? quests.find((q) => q.id === questId) : null;
    await logSession(
      addedMinutes,
      blocksCompleted,
      focusConfig?.targetMinutes ?? null,
      questId,
      targetQuest?.title,
    );
    setFocusConfig(null);
    setSelectedQuestId(null);
  };

  const handleStartGeneralFocus = (options: {
    targetMinutes: number | null;
    initialBlocks?: number;
  }) => {
    setFocusConfig({
      quest: null,
      targetMinutes: options.targetMinutes,
      initialBlocks: options.initialBlocks,
    });
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
      subtasks: quest.subtasks ? [...quest.subtasks] : [],
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
  const activeFocusQuest = focusConfig?.quest
    ? quests.find((quest) => quest.id === focusConfig.quest?.id) ?? focusConfig.quest
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

      {focusConfig ? (
        <FocusScreen
          quest={activeFocusQuest}
          targetMinutes={focusConfig.targetMinutes}
          initialBlocks={focusConfig.initialBlocks}
          onQuit={() => setFocusConfig(null)}
          onFinish={handleFocusFinished}
        />
      ) : (
        <main className="appShell">
          <AppHeader
            userInitial={userInitial}
            onOpenNewQuest={openNewQuest}
            onSignOut={signOut}
            onNavigateTasks={handleTasksNavigation}
          />

          {authError ? <p className="formError" role="alert">{authError}</p> : null}

          {activeTab === "school" ? (
            <div className="content" id="top">
              <SchoolView userId={user.uid} />
            </div>
          ) : activeTab === "focus" ? (
            <div className="content" id="top">
              <LockInView
                userId={user.uid}
                today={today}
                onStartFocus={handleStartGeneralFocus}
              />
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
                onToggleSubtask={toggleSubtask}
                onOpenDatePicker={handleOpenListDatePicker}
                onOpenSubtaskDatePicker={handleOpenListSubtaskDatePicker}
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
              onToggleSubtask={(subtaskId) => toggleSubtask(selectedQuest.id, subtaskId)}
              onUpdateSubtask={(subtaskId, updates) => updateSubtask(selectedQuest.id, subtaskId, updates)}
              onAddSubtask={(title, dueDate) => addSubtask(selectedQuest.id, title, dueDate)}
              onDeleteSubtask={(subtaskId) => deleteSubtask(selectedQuest.id, subtaskId)}
              onStartFocus={(targetQuest) => {
                setSelectedQuestId(null);
                setFocusConfig({
                  quest: targetQuest,
                  targetMinutes: null,
                });
              }}
              onUpdateDueDate={(newDate) => updateQuestDueDate(selectedQuest.id, newDate)}
              isUpdating={savingQuestId === selectedQuest.id}
            />
          ) : null}

          {listDatePickerTarget ? (
            <IosDatePickerPopover
              isOpen={Boolean(listDatePickerTarget)}
              currentDate={listDatePickerTarget.currentDueDate}
              today={today}
              anchorRect={listDatePickerTarget.anchorRect}
              onSelectDate={handleSelectListDate}
              onClose={() => setListDatePickerTarget(null)}
              title={listDatePickerTarget.subtaskId ? "Subtask Due Date" : "Quest Due Date"}
            />
          ) : null}

          <LiquidDock
            activeTab={activeTab}
            onNavigateTasks={handleTasksNavigation}
            onNavigateSchool={handleSchoolNavigation}
            onNavigateFocus={handleFocusNavigation}
            onOpenNewQuest={openNewQuest}
          />
        </main>
      )}
    </>
  );
}
