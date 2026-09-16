import type { Quest } from "@/features/quests/types/quest";
import type {
  LifeAttribute,
  RankPosition,
  UserStatsProfile,
} from "../types/stats";
import {
  ATTRIBUTE_ORDER,
  LIFE_ATTRIBUTES,
  RANK_TIERS,
} from "../types/stats";

export function getCurrentSeasonId(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getSeasonDisplayName(seasonId: string): string {
  const [yearStr, monthStr] = seasonId.split("-");
  const monthNum = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const name = monthNames[monthNum - 1] || "Act";
  return `${name} ${year} Act`;
}

export function getDaysRemainingInSeason(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const nextMonthFirstDay = new Date(year, month + 1, 1);
  const diffTime = nextMonthFirstDay.getTime() - date.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export function calculateRankFromRR(cumulativeRR: number): RankPosition {
  const rr = Math.max(0, Math.floor(cumulativeRR));

  // Radiant is division index 24 (2400+ RR)
  if (rr >= 2400) {
    const radiantMeta = RANK_TIERS[RANK_TIERS.length - 1];
    const surplusRR = rr - 2400;
    return {
      tier: "radiant",
      division: 1,
      tierMeta: radiantMeta,
      divisionRR: surplusRR,
      cumulativeRR: rr,
      label: "Radiant",
      progressPercent: 100,
      isUngodlyLockedIn: true,
    };
  }

  // Iterate backwards through tiers
  for (let i = RANK_TIERS.length - 2; i >= 0; i--) {
    const tierMeta = RANK_TIERS[i];
    if (rr >= tierMeta.minCumulativeRR) {
      const tierOffset = rr - tierMeta.minCumulativeRR;
      const divisionIndex = Math.min(2, Math.floor(tierOffset / 100)); // 0, 1, 2
      const division = divisionIndex + 1; // 1, 2, 3
      const divisionRR = tierOffset % 100;
      const label = `${tierMeta.displayName} ${division}`;
      const isUngodlyLockedIn = tierMeta.tier === "immortal";

      return {
        tier: tierMeta.tier,
        division,
        tierMeta,
        divisionRR,
        cumulativeRR: rr,
        label,
        progressPercent: divisionRR, // each division is 100 RR
        isUngodlyLockedIn,
      };
    }
  }

  // Fallback Iron 1
  const ironMeta = RANK_TIERS[0];
  return {
    tier: "iron",
    division: 1,
    tierMeta: ironMeta,
    divisionRR: 0,
    cumulativeRR: 0,
    label: "Iron 1",
    progressPercent: 0,
    isUngodlyLockedIn: false,
  };
}

export function applySoftReset(currentRR: number): {
  newRR: number;
  droppedDivisions: number;
} {
  // In Valorant, soft reset drops ~2 full tiers (6 divisions = 600 RR)
  // Radiant (2400+) drops down to Ascendant 1 (1800 RR)
  const dropAmount = 600;
  const newRR = Math.max(0, currentRR - dropAmount);
  return {
    newRR,
    droppedDivisions: 6,
  };
}

export function classifyCategory(category: string, title?: string): LifeAttribute {
  const text = `${category} ${title ?? ""}`.toLowerCase();

  for (const attr of ATTRIBUTE_ORDER) {
    const meta = LIFE_ATTRIBUTES[attr];
    for (const kw of meta.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return attr;
      }
    }
  }

  // Category heuristics
  if (/work|job|boss|career|money|business|crypto|app|client/i.test(text)) return "ambition";
  if (/school|college|uni|class|study|math|cis|read|hw|exam|homework/i.test(text)) return "intellect";
  if (/gym|run|lift|sleep|walk|cardio|water|diet|eat|food|doctor/i.test(text)) return "physical";
  if (/meditat|mind|breathe|journal|pray|relax/i.test(text)) return "mental";
  if (/habit|clean|room|laundry|routine|morning|discipline/i.test(text)) return "discipline";
  if (/call|talk|friend|mom|dad|sister|bro|hang|meet/i.test(text)) return "social";

  return "discipline";
}

export function calculateAttributeScores(
  quests: Quest[] = [],
  overrides?: Partial<Record<LifeAttribute, number>>,
): Record<LifeAttribute, number> {
  // Baseline scores strictly start at 0 and track actual activity
  const baseScores: Record<LifeAttribute, number> = {
    physical: 0,
    social: 0,
    discipline: 0,
    mental: 0,
    intellect: 0,
    ambition: 0,
  };

  // Tally completed quests and focus minutes per attribute
  const attributeActivity: Record<LifeAttribute, { completed: number; focusMins: number }> = {
    physical: { completed: 0, focusMins: 0 },
    social: { completed: 0, focusMins: 0 },
    discipline: { completed: 0, focusMins: 0 },
    mental: { completed: 0, focusMins: 0 },
    intellect: { completed: 0, focusMins: 0 },
    ambition: { completed: 0, focusMins: 0 },
  };

  for (const q of quests) {
    const attr = classifyCategory(q.category, q.title);
    if (q.completed) {
      attributeActivity[attr].completed += 1;
    }
    if (q.focusMinutes > 0) {
      attributeActivity[attr].focusMins += q.focusMinutes;
    }
  }

  const finalScores: Record<LifeAttribute, number> = { ...baseScores };

  for (const attr of ATTRIBUTE_ORDER) {
    const act = attributeActivity[attr];
    // Each completed quest gives +5 points, every 10 min focus gives +1 point
    const earnedBonus = act.completed * 5 + Math.floor(act.focusMins / 10);
    const score = Math.min(99, Math.max(0, earnedBonus));
    finalScores[attr] = score;

    // Apply manual override if explicitly provided
    if (overrides && typeof overrides[attr] === "number") {
      finalScores[attr] = Math.min(99, Math.max(0, overrides[attr]!));
    }
  }

  return finalScores;
}

export function calculateOverallRating(scores: Record<LifeAttribute, number>): number {
  const sum = ATTRIBUTE_ORDER.reduce((acc, attr) => acc + (scores[attr] || 0), 0);
  return Math.round(sum / ATTRIBUTE_ORDER.length);
}
