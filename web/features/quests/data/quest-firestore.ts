import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  onSnapshot,
  runTransaction,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { Quest, QuestForm, Subtask } from "../types/quest";
import { saveQuestOrder, sortQuestsByStoredOrder } from "./quest-storage";

export function subscribeQuests(
  userId: string,
  onData: (quests: Quest[]) => void,
  onError: (err: unknown) => void,
): () => void {
  const database = getFirebaseDb();
  const questQuery = query(
    collection(database, "users", userId, "quests"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    questQuery,
    (snapshot) => {
      const fetched: Quest[] = snapshot.docs.map((quest) => {
        const data = quest.data();
        return {
          id: quest.id,
          title: String(data.title ?? ""),
          description: String(data.description ?? ""),
          category: String(data.category ?? "General"),
          dueDate: String(data.dueDate ?? ""),
          completed: Boolean(data.completed),
          focusMinutes: Number(data.focusMinutes ?? 0),
          order: typeof data.order === "number" ? data.order : undefined,
          subtasks: Array.isArray(data.subtasks)
            ? data.subtasks.map((s: Record<string, unknown>) => ({
                id: String(s.id ?? ""),
                title: String(s.title ?? ""),
                completed: Boolean(s.completed),
                dueDate: s.dueDate ? String(s.dueDate) : undefined,
              }))
            : [],
        };
      });

      onData(sortQuestsByStoredOrder(fetched, userId));
    },
    onError,
  );
}

function sanitizeSubtasks(subtasks?: Subtask[]): Record<string, unknown>[] {
  if (!Array.isArray(subtasks)) return [];
  return subtasks.map((s) => {
    const item: Record<string, unknown> = {
      id: s.id,
      title: s.title,
      completed: Boolean(s.completed),
    };
    if (s.dueDate) {
      item.dueDate = s.dueDate;
    }
    return item;
  });
}

export async function toggleQuestInFirestore(
  userId: string,
  questId: string,
  completed: boolean,
): Promise<void> {
  const database = getFirebaseDb();
  await updateDoc(doc(database, "users", userId, "quests", questId), { completed });
}

export async function createQuestInFirestore(
  userId: string,
  form: QuestForm,
  minOrder: number,
): Promise<string> {
  const database = getFirebaseDb();
  const docRef = await addDoc(collection(database, "users", userId, "quests"), {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    dueDate: form.dueDate,
    completed: false,
    focusMinutes: 0,
    order: minOrder - 1,
    createdAt: Date.now(),
    subtasks: sanitizeSubtasks(form.subtasks),
  });
  return docRef.id;
}

export async function updateQuestInFirestore(
  userId: string,
  questId: string,
  form: QuestForm,
): Promise<void> {
  const database = getFirebaseDb();
  await updateDoc(doc(database, "users", userId, "quests", questId), {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    dueDate: form.dueDate,
    subtasks: sanitizeSubtasks(form.subtasks),
  });
}

export async function updateSubtasksInFirestore(
  userId: string,
  questId: string,
  subtasks: Subtask[],
): Promise<void> {
  const database = getFirebaseDb();
  await updateDoc(doc(database, "users", userId, "quests", questId), {
    subtasks: sanitizeSubtasks(subtasks),
  });
}

export async function deleteQuestInFirestore(userId: string, questId: string): Promise<void> {
  const database = getFirebaseDb();
  await deleteDoc(doc(database, "users", userId, "quests", questId));
}

export async function saveQuestOrderToFirestore(
  userId: string,
  reorderedQuests: Quest[],
): Promise<void> {
  saveQuestOrder(userId, reorderedQuests);

  try {
    const database = getFirebaseDb();
    const batch = writeBatch(database);
    reorderedQuests.forEach((quest, index) => {
      const questRef = doc(database, "users", userId, "quests", quest.id);
      batch.update(questRef, { order: index });
    });
    await batch.commit();
  } catch (err) {
    console.warn("Could not persist quest order to Firestore", err);
  }
}

export async function completeQuestFocusSession(
  userId: string,
  questId: string,
  addedMinutes: number,
): Promise<void> {
  const database = getFirebaseDb();
  const questRef = doc(database, "users", userId, "quests", questId);

  await runTransaction(database, async (transaction) => {
    const questDoc = await transaction.get(questRef);
    if (!questDoc.exists()) {
      throw new Error("Quest no longer exists.");
    }
    const data = questDoc.data();
    const currentFocus = typeof data.focusMinutes === "number" ? Math.floor(data.focusMinutes) : 0;
    const newFocusMinutes = currentFocus + addedMinutes;

    transaction.update(questRef, {
      completed: true,
      focusMinutes: newFocusMinutes,
    });
  });
}
