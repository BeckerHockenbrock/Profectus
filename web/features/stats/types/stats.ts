export type LifeAttribute =
  | "discipline"
  | "intellect"
  | "love"
  | "social"
  | "exercise"
  | "sleep";

export interface AttributeMeta {
  id: LifeAttribute;
  name: string;
  color: string;
  glowColor: string;
  description: string;
  keywords: string[];
}

export const LIFE_ATTRIBUTES: Record<LifeAttribute, AttributeMeta> = {
  exercise: {
    id: "exercise",
    name: "Exercise",
    color: "#10b981", // Emerald Green (top vertex)
    glowColor: "rgba(16, 185, 129, 0.4)",
    description: "Workouts, cardio, lifting, sports & physical activity",
    keywords: ["gym", "workout", "cardio", "run", "fitness", "lift", "training", "exercise", "walk", "stretch", "swim", "bike", "sports", "pushups"],
  },
  intellect: {
    id: "intellect",
    name: "Intellect",
    color: "#06b6d4", // Bright Cyan (top-right vertex)
    glowColor: "rgba(6, 182, 212, 0.4)",
    description: "Academics, learning, deep reading & critical thinking",
    keywords: ["school", "cis", "study", "exam", "reading", "read", "math", "class", "lecture", "homework", "learn", "course", "algorithm", "code", "dev"],
  },
  discipline: {
    id: "discipline",
    name: "Discipline",
    color: "#ef4444", // Crimson Red (bottom-right vertex)
    glowColor: "rgba(239, 68, 68, 0.4)",
    description: "Consistency, morning routines, habits & grit",
    keywords: ["habit", "discipline", "routine", "morning", "chores", "clean", "streak", "daily", "organize", "focus", "grit", "willpower"],
  },
  sleep: {
    id: "sleep",
    name: "Sleep",
    color: "#8b5cf6", // Vivid Violet / Purple (bottom vertex)
    glowColor: "rgba(139, 92, 246, 0.4)",
    description: "Sleep hygiene, rest, bedtime consistency & recovery",
    keywords: ["sleep", "nap", "rest", "bedtime", "wake", "bed", "dream", "recovery", "insomnia", "circadian", "night"],
  },
  love: {
    id: "love",
    name: "Love",
    color: "#f43f5e", // Rose Pink (bottom-left vertex)
    glowColor: "rgba(244, 63, 94, 0.4)",
    description: "Romance, gratitude, self-love, kindness & deep affection",
    keywords: ["love", "date", "partner", "gratitude", "relationship", "family", "care", "heart", "compassion", "kindness", "selfcare"],
  },
  social: {
    id: "social",
    name: "Social",
    color: "#3b82f6", // Vivid Blue (top-left vertex)
    glowColor: "rgba(59, 130, 246, 0.4)",
    description: "Friendships, connection, hangouts & community",
    keywords: ["social", "call", "friend", "dinner", "party", "network", "meeting", "hangout", "catchup", "club", "talk", "group"],
  },
};

export const ATTRIBUTE_ORDER: LifeAttribute[] = [
  "exercise",
  "intellect",
  "discipline",
  "sleep",
  "love",
  "social",
];

export type RankTier =
  | "iron"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "ascendant"
  | "immortal"
  | "radiant";

export interface RankTierMeta {
  tier: RankTier;
  displayName: string;
  divisions: number[]; // e.g. [1, 2, 3] or [1] for radiant
  color: string;
  accentColor: string;
  badgeGlow: string;
  minCumulativeRR: number;
  isLockedInTier?: boolean; // immortal and radiant
}

export const RANK_TIERS: RankTierMeta[] = [
  {
    tier: "iron",
    displayName: "Iron",
    divisions: [1, 2, 3],
    color: "#6b7280",
    accentColor: "#9ca3af",
    badgeGlow: "rgba(156, 163, 175, 0.25)",
    minCumulativeRR: 0,
  },
  {
    tier: "bronze",
    displayName: "Bronze",
    divisions: [1, 2, 3],
    color: "#b45309",
    accentColor: "#d97706",
    badgeGlow: "rgba(217, 119, 6, 0.3)",
    minCumulativeRR: 300,
  },
  {
    tier: "silver",
    displayName: "Silver",
    divisions: [1, 2, 3],
    color: "#94a3b8",
    accentColor: "#cbd5e1",
    badgeGlow: "rgba(203, 213, 225, 0.35)",
    minCumulativeRR: 600,
  },
  {
    tier: "gold",
    displayName: "Gold",
    divisions: [1, 2, 3],
    color: "#eab308",
    accentColor: "#facc15",
    badgeGlow: "rgba(250, 204, 21, 0.4)",
    minCumulativeRR: 900,
  },
  {
    tier: "platinum",
    displayName: "Platinum",
    divisions: [1, 2, 3],
    color: "#06b6d4",
    accentColor: "#22d3ee",
    badgeGlow: "rgba(34, 211, 238, 0.45)",
    minCumulativeRR: 1200,
  },
  {
    tier: "diamond",
    displayName: "Diamond",
    divisions: [1, 2, 3],
    color: "#a855f7",
    accentColor: "#c084fc",
    badgeGlow: "rgba(192, 132, 252, 0.5)",
    minCumulativeRR: 1500,
  },
  {
    tier: "ascendant",
    displayName: "Ascendant",
    divisions: [1, 2, 3],
    color: "#10b981",
    accentColor: "#34d399",
    badgeGlow: "rgba(52, 211, 153, 0.55)",
    minCumulativeRR: 1800,
  },
  {
    tier: "immortal",
    displayName: "Immortal",
    divisions: [1, 2, 3],
    color: "#ef4444",
    accentColor: "#f43f5e",
    badgeGlow: "rgba(244, 63, 94, 0.65)",
    minCumulativeRR: 2100,
    isLockedInTier: true,
  },
  {
    tier: "radiant",
    displayName: "Radiant",
    divisions: [1],
    color: "#f59e0b",
    accentColor: "#fbbf24",
    badgeGlow: "rgba(251, 191, 36, 0.8)",
    minCumulativeRR: 2400,
    isLockedInTier: true,
  },
];

export interface RankPosition {
  tier: RankTier;
  division: number; // 1, 2, or 3 (Radiant is 1)
  tierMeta: RankTierMeta;
  divisionRR: number; // 0-99 (or 0+ for Radiant)
  cumulativeRR: number; // Total season RR
  label: string; // e.g. "Ascendant 2", "Radiant"
  progressPercent: number; // 0-100% to next division
  isUngodlyLockedIn: boolean;
}

export interface SeasonHistoryItem {
  seasonId: string; // e.g. "2026-08"
  seasonName: string; // e.g. "August 2026 Act"
  finalTier: RankTier;
  finalDivision: number;
  finalRR: number;
  peakTier: RankTier;
  peakDivision: number;
  totalSeasonXP: number;
  closedAt: string;
}

export interface UserStatsProfile {
  currentSeasonId: string; // "YYYY-MM"
  seasonCumulativeRR: number; // monthly ladder score
  lifetimeXP: number; // total all-time focus minutes + completed quests XP
  monthFocusMinutes: number;
  monthQuestsCompleted: number;
  lifetimeFocusMinutes: number;
  lifetimeQuestsCompleted: number;
  seasonPeakCumulativeRR: number;
  lifetimePeakCumulativeRR: number;
  seasonHistory: SeasonHistoryItem[];
  attributeOverrides?: Partial<Record<LifeAttribute, number>>;
  attributeBonusPoints?: Partial<Record<LifeAttribute, number>>;
  bonusXP?: number;
  bonusRR?: number;
  bonusFocusMins?: number;
  lastResetNotice?: {
    seasonId: string;
    previousRank: string;
    newRank: string;
    shown: boolean;
  };
}
