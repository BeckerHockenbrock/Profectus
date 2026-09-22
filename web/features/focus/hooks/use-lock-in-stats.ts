"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FocusSessionRecord } from "../types/focus";
import {
  calculateGrindStreak,
  getTodayStats,
  loadFocusSessions,
} from "../data/focus-storage";
import {
  recordFocusSession,
  subscribeFocusSessions,
} from "../data/focus-firestore";
import { getLocalTodayString } from "@/features/quests/domain/date-utils";

export function useLockInStats(userId?: string | null, today: string = getLocalTodayString()) {
  const [sessions, setSessions] = useState<FocusSessionRecord[]>(() => loadFocusSessions(userId));

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeFocusSessions(userId, (data) => {
      setSessions(data);
    });

    return () => unsubscribe();
  }, [userId]);

  const todayStats = useMemo(() => {
    return getTodayStats(sessions, today);
  }, [sessions, today]);

  const streak = useMemo(() => {
    return calculateGrindStreak(sessions, today);
  }, [sessions, today]);

  const logSession = useCallback(
    async (
      durationMinutes: number,
      blocksCompleted: number,
      targetMinutes: number | null = null,
      questId?: string,
      questTitle?: string,
    ) => {
      const newSession: FocusSessionRecord = {
        id: `focus-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: today,
        timestamp: Date.now(),
        durationMinutes,
        blocksCompleted,
        targetMinutes,
        questId,
        questTitle,
      };

      const updated = await recordFocusSession(userId, newSession);
      setSessions(updated);
      return newSession;
    },
    [today, userId],
  );

  return {
    sessions,
    todayStats,
    streak,
    logSession,
  };
}
