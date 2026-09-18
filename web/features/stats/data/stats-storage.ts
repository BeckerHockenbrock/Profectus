import type { Quest } from "@/features/quests/types/quest";
import type {
  LifeAttribute,
  SeasonHistoryItem,
  UserStatsProfile,
} from "../types/stats";
import {
  applySoftReset,
  calculateRankFromRR,
  getCurrentSeasonId,
  getSeasonDisplayName,
} from "../domain/rank-math";

const STATS_STORAGE_KEY_PREFIX = "todo-quest-stats-v2";

export function getStatsStorageKey(userId?: string | null): string {
  return `${STATS_STORAGE_KEY_PREFIX}-${userId || "default"}`;
}

export function getInitialStatsProfile(quests: Quest[] = []): UserStatsProfile {
  const currentSeasonId = getCurrentSeasonId();
  const totalFocus = quests.reduce((sum, q) => sum + (q.focusMinutes || 0), 0);
  const completedCount = quests.filter((q) => q.completed).length;

  // Real tracked baseline: 1 focus minute = 1 XP/RR, 1 completed quest = 25 XP/RR
  const calculatedRR = totalFocus + completedCount * 25;
  const calculatedXP = totalFocus + completedCount * 25;

  return {
    currentSeasonId,
    seasonCumulativeRR: calculatedRR,
    lifetimeXP: calculatedXP,
    monthFocusMinutes: totalFocus,
    monthQuestsCompleted: completedCount,
    lifetimeFocusMinutes: totalFocus,
    lifetimeQuestsCompleted: completedCount,
    seasonPeakCumulativeRR: calculatedRR,
    lifetimePeakCumulativeRR: calculatedXP,
    seasonHistory: [],
    attributeOverrides: {},
    attributeBonusPoints: {
      discipline: 0,
      intellect: 0,
      love: 0,
      social: 0,
      exercise: 0,
      sleep: 0,
    },
    attributeAverages: {
      discipline: 0,
      intellect: 0,
      love: 0,
      social: 0,
      exercise: 0,
      sleep: 0,
    },
  };
}

export function loadUserStats(userId?: string | null, quests: Quest[] = []): UserStatsProfile {
  if (typeof window === "undefined") {
    return getInitialStatsProfile(quests);
  }

  try {
    // Purge legacy v1 mock profile if present
    try {
      localStorage.removeItem(`todo-quest-stats-${userId || "default"}`);
    } catch {}

    const raw = localStorage.getItem(getStatsStorageKey(userId));
    if (!raw) {
      const initial = getInitialStatsProfile(quests);
      saveUserStats(initial, userId);
      return initial;
    }

    const parsed: UserStatsProfile = JSON.parse(raw);
    const checked = checkAndApplyMonthlyReset(parsed);

    // Sync loaded profile with real live quest progression (XP strictly reflects live tasks)
    const totalFocus = quests.reduce((sum, q) => sum + (q.focusMinutes || 0), 0);
    const completedCount = quests.filter((q) => q.completed).length;
    const questEarnedXP = totalFocus + completedCount * 25;

    const liveXP = questEarnedXP + (checked.bonusXP || 0);
    const liveRR = questEarnedXP + (checked.bonusRR || 0);
    const liveFocus = totalFocus + (checked.bonusFocusMins || 0);

    const synced: UserStatsProfile = {
      ...checked,
      seasonCumulativeRR: liveRR,
      lifetimeXP: liveXP,
      monthFocusMinutes: liveFocus,
      lifetimeFocusMinutes: liveFocus,
      monthQuestsCompleted: completedCount,
      lifetimeQuestsCompleted: completedCount,
      seasonPeakCumulativeRR: Math.max(checked.seasonPeakCumulativeRR || 0, liveRR),
      lifetimePeakCumulativeRR: Math.max(checked.lifetimePeakCumulativeRR || 0, liveXP),
    };

    return synced;
  } catch (err) {
    console.error("Failed to load user stats profile:", err);
    return getInitialStatsProfile(quests);
  }
}

export function saveUserStats(profile: UserStatsProfile, userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStatsStorageKey(userId), JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to save user stats profile:", err);
  }
}

export function checkAndApplyMonthlyReset(profile: UserStatsProfile): UserStatsProfile {
  const currentSeason = getCurrentSeasonId();

  if (profile.currentSeasonId === currentSeason) {
    return profile;
  }

  // Monthly season rollover detected!
  const prevSeasonId = profile.currentSeasonId;
  const prevRank = calculateRankFromRR(profile.seasonCumulativeRR);
  const peakRank = calculateRankFromRR(profile.seasonPeakCumulativeRR);

  // Archive finished season
  const historyItem: SeasonHistoryItem = {
    seasonId: prevSeasonId,
    seasonName: getSeasonDisplayName(prevSeasonId),
    finalTier: prevRank.tier,
    finalDivision: prevRank.division,
    finalRR: prevRank.divisionRR,
    peakTier: peakRank.tier,
    peakDivision: peakRank.division,
    totalSeasonXP: profile.monthFocusMinutes + profile.monthQuestsCompleted * 50,
    closedAt: new Date().toISOString(),
  };

  // Apply soft reset: drop by 2 tiers (6 divisions / 600 RR)
  const { newRR } = applySoftReset(profile.seasonCumulativeRR);
  const newRank = calculateRankFromRR(newRR);

  const updated: UserStatsProfile = {
    ...profile,
    currentSeasonId: currentSeason,
    seasonCumulativeRR: newRR,
    seasonPeakCumulativeRR: newRR,
    monthFocusMinutes: 0,
    monthQuestsCompleted: 0,
    seasonHistory: [historyItem, ...(profile.seasonHistory || [])],
    lastResetNotice: {
      seasonId: currentSeason,
      previousRank: prevRank.label,
      newRank: newRank.label,
      shown: false,
    },
  };

  return updated;
}

export function simulateMonthlyReset(profile: UserStatsProfile): UserStatsProfile {
  const prevRank = calculateRankFromRR(profile.seasonCumulativeRR);
  const peakRank = calculateRankFromRR(profile.seasonPeakCumulativeRR);
  const { newRR } = applySoftReset(profile.seasonCumulativeRR);
  const newRank = calculateRankFromRR(newRR);

  const historyItem: SeasonHistoryItem = {
    seasonId: profile.currentSeasonId,
    seasonName: getSeasonDisplayName(profile.currentSeasonId),
    finalTier: prevRank.tier,
    finalDivision: prevRank.division,
    finalRR: prevRank.divisionRR,
    peakTier: peakRank.tier,
    peakDivision: peakRank.division,
    totalSeasonXP: profile.monthFocusMinutes + profile.monthQuestsCompleted * 50,
    closedAt: new Date().toISOString(),
  };

  return {
    ...profile,
    seasonCumulativeRR: newRR,
    seasonPeakCumulativeRR: newRR,
    monthFocusMinutes: 0,
    monthQuestsCompleted: 0,
    seasonHistory: [historyItem, ...(profile.seasonHistory || [])],
    lastResetNotice: {
      seasonId: profile.currentSeasonId,
      previousRank: prevRank.label,
      newRank: newRank.label,
      shown: false,
    },
  };
}

export function applyJournalRewards(
  userId: string | null | undefined,
  _stat: LifeAttribute,
  _score: number,
  earnedXP: number,
  updatedAverages: Partial<Record<LifeAttribute, number>>,
): UserStatsProfile {
  const current = loadUserStats(userId);

  const newBonusXP = (current.bonusXP || 0) + earnedXP;
  const newBonusRR = (current.bonusRR || 0) + earnedXP;
  const newTotalXP = (current.lifetimeXP || 0) + earnedXP;
  const newTotalRR = (current.seasonCumulativeRR || 0) + earnedXP;

  const updated: UserStatsProfile = {
    ...current,
    bonusXP: newBonusXP,
    bonusRR: newBonusRR,
    lifetimeXP: newTotalXP,
    seasonCumulativeRR: newTotalRR,
    attributeAverages: {
      ...(current.attributeAverages || {}),
      ...updatedAverages,
    },
    seasonPeakCumulativeRR: Math.max(current.seasonPeakCumulativeRR || 0, newTotalRR),
    lifetimePeakCumulativeRR: Math.max(current.lifetimePeakCumulativeRR || 0, newTotalXP),
  };

  saveUserStats(updated, userId);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("altiora-stats-updated", { detail: updated }));
  }

  return updated;
}
