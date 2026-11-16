"use client";

import { useEffect, useState } from "react";
import { subscribeBrief } from "../data/brief-firestore";
import type { DailyBrief } from "../types/brief";

export function useDailyBrief(userId: string | null | undefined, date: string) {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [activeKey, setActiveKey] = useState(`${userId ?? ""}:${date}`);

  const nextKey = `${userId ?? ""}:${date}`;
  if (activeKey !== nextKey) {
    setActiveKey(nextKey);
    setBrief(null);
    setLoadError("");
    setIsLoading(Boolean(userId));
  }

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeBrief(
      userId,
      date,
      (next) => {
        setBrief(next);
        setIsLoading(false);
      },
      () => {
        setLoadError("Could not load today's brief.");
        setIsLoading(false);
      },
    );
  }, [userId, date]);

  return { brief, loadError, isLoading };
}
