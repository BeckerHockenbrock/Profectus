"use client";

import { useState } from "react";
import type { Quest, QuestForm, Subtask } from "../types/quest";
import {
  completeQuestFocusSession,
  createQuestInFirestore,
  deleteQuestInFirestore,
  toggleQuestInFirestore,
  updateQuestDueDateInFirestore,
  updateQuestInFirestore,
  updateSubtasksInFirestore,
} from "../data/quest-firestore";

function createSubtaskId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type UseQuestMutationsProps = {
  userId: string | null | undefined;
  quests: Quest[];
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
};

export function useQuestMutations({
  userId,
  quests,
  setQuests,
}: UseQuestMutationsProps) {
  const [savingQuestId, setSavingQuestId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mutationError, setMutationError] = useState("");

  const toggleQuest = async (id: string) => {
    const quest = quests.find((current) => current.id === id);

    if (!quest || !userId || savingQuestId !== null) {
      return;
    }

    const completed = !quest.completed;
    setMutationError("");
    setSavingQuestId(id);
    setQuests((current) => current.map((item) => (item.id === id ? { ...item, completed } : item)));

    try {
      await toggleQuestInFirestore(userId, id, completed);
    } catch {
      setQuests((current) => current.map((item) => (item.id === id ? quest : item)));
      setMutationError("That change did not save. Try again.");
    } finally {
      setSavingQuestId(null);
    }
  };

  const createQuest = async (form: QuestForm) => {
    const title = form.title.trim();
    const category = form.category.trim();

    if (!title || !category || !userId || isCreating) return false;

    setMutationError("");
    setIsCreating(true);

    try {
      const minOrder = quests.reduce((min, q) => Math.min(min, q.order ?? 0), 0);
      await createQuestInFirestore(userId, form, minOrder);
      return true;
    } catch {
      setMutationError("That quest did not save. Try again.");
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const updateQuest = async (id: string, form: QuestForm) => {
    const quest = quests.find((current) => current.id === id);
    const title = form.title.trim();
    const category = form.category.trim();

    if (!quest || !title || !category || !userId || savingQuestId !== null) return false;

    const updatedQuest = {
      ...quest,
      title,
      description: form.description.trim(),
      category,
      dueDate: form.dueDate,
      subtasks: form.subtasks ?? quest.subtasks ?? [],
    };

    setMutationError("");
    setSavingQuestId(id);
    setQuests((current) => current.map((item) => (item.id === id ? updatedQuest : item)));

    try {
      await updateQuestInFirestore(userId, id, form);
      return true;
    } catch {
      setQuests((current) => current.map((item) => (item.id === id ? quest : item)));
      setMutationError("That quest did not save. Try again.");
      return false;
    } finally {
      setSavingQuestId(null);
    }
  };

  const updateQuestDueDate = async (id: string, dueDate: string) => {
    const quest = quests.find((current) => current.id === id);
    if (!quest || !userId || savingQuestId !== null) return false;

    const previousDueDate = quest.dueDate;
    const updatedQuest = { ...quest, dueDate };

    setMutationError("");
    setSavingQuestId(id);
    setQuests((current) => current.map((item) => (item.id === id ? updatedQuest : item)));

    try {
      await updateQuestDueDateInFirestore(userId, id, dueDate);
      return true;
    } catch {
      setQuests((current) => current.map((item) => (item.id === id ? { ...item, dueDate: previousDueDate } : item)));
      setMutationError("Could not update due date. Try again.");
      return false;
    } finally {
      setSavingQuestId(null);
    }
  };

  const deleteQuest = async (id: string) => {
    const questIndex = quests.findIndex((current) => current.id === id);
    const quest = questIndex >= 0 ? quests[questIndex] : undefined;

    if (!quest || !userId || savingQuestId !== null) return false;

    setMutationError("");
    setSavingQuestId(id);
    setQuests((current) => current.filter((item) => item.id !== id));

    try {
      await deleteQuestInFirestore(userId, id);
      return true;
    } catch {
      setQuests((current) => {
        if (current.some((item) => item.id === id)) return current;
        const restored = [...current];
        restored.splice(Math.min(questIndex, restored.length), 0, quest);
        return restored;
      });
      setMutationError("That quest could not be deleted. Try again.");
      return false;
    } finally {
      setSavingQuestId(null);
    }
  };

  const toggleSubtask = async (questId: string, subtaskId: string) => {
    const quest = quests.find((current) => current.id === questId);
    if (!quest || !userId) return;

    const currentSubtasks = quest.subtasks ?? [];
    const updatedSubtasks = currentSubtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    setMutationError("");
    setQuests((current) =>
      current.map((item) => (item.id === questId ? { ...item, subtasks: updatedSubtasks } : item))
    );

    try {
      await updateSubtasksInFirestore(userId, questId, updatedSubtasks);
    } catch {
      setQuests((current) =>
        current.map((item) => (item.id === questId ? quest : item))
      );
      setMutationError("That subtask could not be updated. Try again.");
    }
  };

  const addSubtask = async (questId: string, title: string, dueDate?: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !userId) return false;

    const quest = quests.find((current) => current.id === questId);
    if (!quest) return false;

    const newSubtask: Subtask = {
      id: createSubtaskId(),
      title: trimmedTitle,
      completed: false,
      ...(dueDate ? { dueDate } : {}),
    };

    const currentSubtasks = quest.subtasks ?? [];
    const updatedSubtasks = [...currentSubtasks, newSubtask];

    setMutationError("");
    setQuests((current) =>
      current.map((item) => (item.id === questId ? { ...item, subtasks: updatedSubtasks } : item))
    );

    try {
      await updateSubtasksInFirestore(userId, questId, updatedSubtasks);
      return true;
    } catch {
      setQuests((current) =>
        current.map((item) => (item.id === questId ? quest : item))
      );
      setMutationError("That subtask could not be added. Try again.");
      return false;
    }
  };

  const updateSubtask = async (questId: string, subtaskId: string, updates: Partial<Subtask>) => {
    const quest = quests.find((current) => current.id === questId);
    if (!quest || !userId) return false;

    const currentSubtasks = quest.subtasks ?? [];
    const updatedSubtasks = currentSubtasks.map((st) =>
      st.id === subtaskId ? { ...st, ...updates } : st
    );

    setMutationError("");
    setQuests((current) =>
      current.map((item) => (item.id === questId ? { ...item, subtasks: updatedSubtasks } : item))
    );

    try {
      await updateSubtasksInFirestore(userId, questId, updatedSubtasks);
      return true;
    } catch {
      setQuests((current) =>
        current.map((item) => (item.id === questId ? quest : item))
      );
      setMutationError("That subtask could not be updated. Try again.");
      return false;
    }
  };

  const deleteSubtask = async (questId: string, subtaskId: string) => {
    const quest = quests.find((current) => current.id === questId);
    if (!quest || !userId) return false;

    const currentSubtasks = quest.subtasks ?? [];
    const updatedSubtasks = currentSubtasks.filter((st) => st.id !== subtaskId);

    setMutationError("");
    setQuests((current) =>
      current.map((item) => (item.id === questId ? { ...item, subtasks: updatedSubtasks } : item))
    );

    try {
      await updateSubtasksInFirestore(userId, questId, updatedSubtasks);
      return true;
    } catch {
      setQuests((current) =>
        current.map((item) => (item.id === questId ? quest : item))
      );
      setMutationError("That subtask could not be deleted. Try again.");
      return false;
    }
  };

  const reorderSubtasks = async (questId: string, subtasks: Subtask[]) => {
    const quest = quests.find((current) => current.id === questId);
    if (!quest || !userId) return false;

    setMutationError("");
    setQuests((current) =>
      current.map((item) => (item.id === questId ? { ...item, subtasks } : item))
    );

    try {
      await updateSubtasksInFirestore(userId, questId, subtasks);
      return true;
    } catch {
      setQuests((current) =>
        current.map((item) => (item.id === questId ? quest : item))
      );
      setMutationError("Could not reorder subtasks. Try again.");
      return false;
    }
  };

  const finishFocusSession = async (questId: string, addedMinutes: number) => {
    if (!userId) {
      throw new Error("Could not save focus session. Please check your connection and retry.");
    }

    await completeQuestFocusSession(userId, questId, addedMinutes);
    setQuests((current) =>
      current.map((item) =>
        item.id === questId
          ? {
              ...item,
              completed: true,
              focusMinutes: item.focusMinutes + addedMinutes,
            }
          : item,
      ),
    );
  };

  return {
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
    reorderSubtasks,
    finishFocusSession,
  };
}
