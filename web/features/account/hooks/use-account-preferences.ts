"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyThemeToDocument,
  loadAccountPreferences,
  saveAccountPreferences,
} from "../data/account-storage";
import {
  DEFAULT_ACCOUNT_PREFERENCES,
  type AccountPreferences,
  type AppThemeId,
} from "../types/account";

const MAX_AVATAR_BYTES = 750_000;

function prefsForUser(userId: string | null | undefined): AccountPreferences {
  if (!userId || typeof window === "undefined") {
    return { ...DEFAULT_ACCOUNT_PREFERENCES };
  }
  return loadAccountPreferences(userId);
}

export function useAccountPreferences(userId: string | null | undefined) {
  const [prefsUserId, setPrefsUserId] = useState(userId);
  const [prefs, setPrefs] = useState<AccountPreferences>(() => prefsForUser(userId));
  const [error, setError] = useState("");

  if (prefsUserId !== userId) {
    setPrefsUserId(userId);
    setPrefs(prefsForUser(userId));
  }

  useEffect(() => {
    applyThemeToDocument(prefs.theme);
  }, [prefs.theme]);

  const persist = useCallback(
    (next: AccountPreferences) => {
      if (!userId) return;
      setPrefs(next);
      saveAccountPreferences(userId, next);
      applyThemeToDocument(next.theme);
    },
    [userId],
  );

  const setTheme = useCallback(
    (theme: AppThemeId) => {
      setError("");
      persist({ ...prefs, theme });
    },
    [persist, prefs],
  );

  const setAvatarFromFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setError("");

      if (!file.type.startsWith("image/")) {
        setError("Choose an image file for your profile picture.");
        return;
      }

      if (file.size > MAX_AVATAR_BYTES) {
        setError("Image is too large. Keep it under about 750 KB.");
        return;
      }

      const dataUrl = await readFileAsDataUrl(file);
      persist({ ...prefs, avatarDataUrl: dataUrl });
    },
    [persist, prefs],
  );

  const clearAvatar = useCallback(() => {
    setError("");
    persist({ ...prefs, avatarDataUrl: null });
  }, [persist, prefs]);

  return {
    prefs,
    error,
    setTheme,
    setAvatarFromFile,
    clearAvatar,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}
