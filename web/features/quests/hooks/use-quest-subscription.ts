"use client";

import { useEffect, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { Quest } from "../types/quest";
import { subscribeQuests } from "../data/quest-firestore";

export function useQuestSubscription(userId: string | null | undefined) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured() || !userId) {
      return;
    }

    const unsubscribe = subscribeQuests(
      userId,
      (fetched) => {
        setQuests(fetched);
        setLoadError("");
      },
      () => {
        setLoadError("Your quests could not be loaded. Try refreshing.");
      },
    );

    return () => {
      unsubscribe();
      setQuests([]);
    };
  }, [userId]);

  return {
    quests,
    setQuests,
    loadError,
  };
}
