export type AppThemeId = "ryoku" | "dawn" | "slate";

export type AccountPreferences = {
  theme: AppThemeId;
  avatarDataUrl: string | null;
};

export const THEME_OPTIONS: Array<{ id: AppThemeId; label: string; swatch: string }> = [
  { id: "ryoku", label: "Ryoku", swatch: "#0b0b0b" },
  { id: "dawn", label: "Dawn", swatch: "#f3eee6" },
  { id: "slate", label: "Slate", swatch: "#1c2430" },
];

export const DEFAULT_ACCOUNT_PREFERENCES: AccountPreferences = {
  theme: "ryoku",
  avatarDataUrl: null,
};
