"use client";

import { useState } from "react";
import type { Quest, QuestForm } from "../types/quest";
import {
  completeQuestFocusSession,
  createQuestInFirestore,
  deleteQuestInFirestore,
  toggleQuestInFirestore,
  updateQuestInFirestore,
} from "../data/quest-firestore";

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
    deleteQuest,
    finishFocusSession,
  };
}
