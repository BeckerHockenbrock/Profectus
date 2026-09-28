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

export function getCategoryOrderStorageKey(userId?: string | null): string {
  return `todo-quest-category-order-${userId || "default"}`;
}

export function loadCategoryOrder(userId?: string | null): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const cachedOrderJson = localStorage.getItem(getCategoryOrderStorageKey(userId));
    if (!cachedOrderJson) return null;
    const parsed = JSON.parse(cachedOrderJson);
    return Array.isArray(parsed) ? (parsed as string[]) : null;
  } catch {
    return null;
  }
}

export function saveCategoryOrder(userId: string | null | undefined, categories: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getCategoryOrderStorageKey(userId),
      JSON.stringify(categories),
    );
  } catch {}
}

export function sortCategoriesByStoredOrder(
  categories: string[],
  storedOrder?: string[] | null,
): string[] {
  if (!storedOrder || storedOrder.length === 0) {
    return [...categories].sort((a, b) => a.localeCompare(b));
  }

  const orderMap = new Map<string, number>(storedOrder.map((cat, index) => [cat, index]));

  return [...categories].sort((a, b) => {
    const orderA = orderMap.get(a);
    const orderB = orderMap.get(b);
    if (typeof orderA === "number" && typeof orderB === "number") {
      return orderA - orderB;
    }
    if (typeof orderA === "number") return -1;
    if (typeof orderB === "number") return 1;
    return a.localeCompare(b);
  });
}
