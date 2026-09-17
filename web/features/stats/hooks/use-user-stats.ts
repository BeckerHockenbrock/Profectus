"use client";

import { useEffect, useMemo, useState } from "react";
import type { Quest } from "@/features/quests/types/quest";
import type { LifeAttribute, RankPosition, UserStatsProfile } from "../types/stats";
import { LIFE_ATTRIBUTES } from "../types/stats";
import {
  calculateAttributeScores,
  calculateRankFromRR,
  getDaysRemainingInSeason,
  getSeasonDisplayName,
} from "../domain/rank-math";
import {
  loadUserStats,
  saveUserStats,
  simulateMonthlyReset,
} from "../data/stats-storage";

export function useUserStats(userId?: string | null, quests: Quest[] = []) {
  const [profile, setProfile] = useState<UserStatsProfile>(() => loadUserStats(userId, quests));
  const [selectedAttr, setSelectedAttr] = useState<LifeAttribute | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // Synchronize profile updates from journal or other tabs
  useEffect(() => {
    const handleStatsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<UserStatsProfile>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      } else {
        setProfile(loadUserStats(userId, quests));
      }
    };

    window.addEventListener("altiora-stats-updated", handleStatsUpdated);
    window.addEventListener("storage", handleStatsUpdated);
    return () => {
      window.removeEventListener("altiora-stats-updated", handleStatsUpdated);
      window.removeEventListener("storage", handleStatsUpdated);
    };
  }, [userId, quests]);

  // Save profile updates
  const updateProfile = (updater: (prev: UserStatsProfile) => UserStatsProfile) => {
    setProfile((prev) => {
      const next = updater(prev);
      saveUserStats(next, userId);
      return next;
    });
  };

  // Live quest progression computation
  const liveQuestStats = useMemo(() => {
    const focusMins = quests.reduce((sum, q) => sum + (q.focusMinutes || 0), 0);
    const completedCount = quests.filter((q) => q.completed).length;
    const earnedXP = focusMins + completedCount * 25;
    return { focusMins, completedCount, earnedXP };
  }, [quests]);

  const effectiveLifetimeXP = liveQuestStats.earnedXP + (profile.bonusXP || 0);
  const effectiveSeasonRR = liveQuestStats.earnedXP + (profile.bonusRR || 0);
  const effectiveFocusMins = liveQuestStats.focusMins + (profile.bonusFocusMins || 0);
  const effectiveQuestsCompleted = liveQuestStats.completedCount;

  // Compute live attribute scores strictly from activity plus journal gains
  const attributeScores = useMemo(() => {
    return calculateAttributeScores(quests, profile.attributeOverrides, profile.attributeBonusPoints);
  }, [quests, profile.attributeOverrides, profile.attributeBonusPoints]);

  // Compute live rank
  const rank: RankPosition = useMemo(() => {
    return calculateRankFromRR(effectiveSeasonRR);
  }, [effectiveSeasonRR]);

  const daysRemaining = useMemo(() => {
    return getDaysRemainingInSeason();
  }, []);

  const seasonName = useMemo(() => {
    return getSeasonDisplayName(profile.currentSeasonId);
  }, [profile.currentSeasonId]);

  // Quests mapped to currently selected attribute
  const selectedAttrQuests = useMemo(() => {
    if (!selectedAttr) return [];
    return quests.filter((q) => {
      const text = `${q.category} ${q.title}`.toLowerCase();
      const meta = LIFE_ATTRIBUTES[selectedAttr];
      return meta.keywords.some((kw) => text.includes(kw.toLowerCase()));
    });
  }, [quests, selectedAttr]);

  // Manual RR Boost for demonstration / testing grind
  const handleAddFocusBonus = (rrAmount: number) => {
    updateProfile((prev) => {
      const newBonusXP = (prev.bonusXP || 0) + rrAmount;
      const newBonusRR = (prev.bonusRR || 0) + rrAmount;
      const newTotalXP = liveQuestStats.earnedXP + newBonusXP;
      const newTotalRR = liveQuestStats.earnedXP + newBonusRR;
      const newPeak = Math.max(prev.seasonPeakCumulativeRR || 0, newTotalRR);
      const newLifetimePeak = Math.max(prev.lifetimePeakCumulativeRR || 0, newTotalXP);
      return {
        ...prev,
        bonusXP: newBonusXP,
        bonusRR: newBonusRR,
        seasonCumulativeRR: newTotalRR,
        lifetimeXP: newTotalXP,
        monthFocusMinutes: prev.monthFocusMinutes + rrAmount,
        lifetimeFocusMinutes: prev.lifetimeFocusMinutes + rrAmount,
        seasonPeakCumulativeRR: newPeak,
        lifetimePeakCumulativeRR: newLifetimePeak,
      };
    });
  };

  // Trigger monthly soft reset
  const handleSimulateSoftReset = () => {
    const updated = simulateMonthlyReset(profile);
    setProfile(updated);
    saveUserStats(updated, userId);
    setResetNotice(
      `Season Rollover: Soft reset applied! You dropped 2 tiers to ${calculateRankFromRR(updated.seasonCumulativeRR).label}. Time to grind back up!`
    );
  };

  return {
    profile,
    selectedAttr,
    setSelectedAttr,
    showHistoryModal,
    setShowHistoryModal,
    resetNotice,
    setResetNotice,
    effectiveLifetimeXP,
    effectiveSeasonRR,
    effectiveFocusMins,
    effectiveQuestsCompleted,
    attributeScores,
    rank,
    daysRemaining,
    seasonName,
    selectedAttrQuests,
    handleAddFocusBonus,
    handleSimulateSoftReset,
    updateProfile,
  };
}
