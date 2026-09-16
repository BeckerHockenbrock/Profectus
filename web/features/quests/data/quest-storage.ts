import type { Quest } from "../types/quest";

function getQuestOrderStorageKey(userId: string) {
  return `todo-quest-order-${userId}`;
}

export function loadQuestOrder(userId: string): string[] | null {
  const cachedOrderJson = localStorage.getItem(getQuestOrderStorageKey(userId));
  return cachedOrderJson ? (JSON.parse(cachedOrderJson) as string[]) : null;
}

export function saveQuestOrder(userId: string, quests: Quest[]): void {
  try {
    localStorage.setItem(
      getQuestOrderStorageKey(userId),
      JSON.stringify(quests.map((quest) => quest.id)),
    );
  } catch {}
}

export function sortQuestsByStoredOrder(quests: Quest[], userId: string): Quest[] {
  try {
    const cachedOrder = loadQuestOrder(userId);
    const orderMap = cachedOrder
      ? new Map<string, number>(cachedOrder.map((id, index) => [id, index]))
      : null;

    quests.sort((a, b) => {
      const orderA = a.order ?? orderMap?.get(a.id);
      const orderB = b.order ?? orderMap?.get(b.id);
      if (typeof orderA === "number" && typeof orderB === "number") {
        return orderA - orderB;
      }
      if (typeof orderA === "number") return -1;
      if (typeof orderB === "number") return 1;
      return 0;
    });
  } catch {}

  return quests;
}
