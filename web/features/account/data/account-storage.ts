import {
  DEFAULT_ACCOUNT_PREFERENCES,
  type AccountPreferences,
  type AppThemeId,
} from "../types/account";

function storageKey(userId: string) {
  return `todo-quest-account-prefs-${userId}`;
}

function isThemeId(value: unknown): value is AppThemeId {
  return value === "ryoku" || value === "dawn" || value === "slate";
}

export function loadAccountPreferences(userId: string): AccountPreferences {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULT_ACCOUNT_PREFERENCES };

    const parsed = JSON.parse(raw) as Partial<AccountPreferences>;
    return {
      theme: isThemeId(parsed.theme) ? parsed.theme : DEFAULT_ACCOUNT_PREFERENCES.theme,
      avatarDataUrl:
        typeof parsed.avatarDataUrl === "string" && parsed.avatarDataUrl.startsWith("data:image/")
          ? parsed.avatarDataUrl
          : null,
    };
  } catch {
    return { ...DEFAULT_ACCOUNT_PREFERENCES };
  }
}

export function saveAccountPreferences(userId: string, prefs: AccountPreferences): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
}

export function applyThemeToDocument(theme: AppThemeId): void {
  document.documentElement.dataset.theme = theme === "ryoku" ? "" : theme;
  if (theme === "ryoku") {
    delete document.documentElement.dataset.theme;
  }
}
