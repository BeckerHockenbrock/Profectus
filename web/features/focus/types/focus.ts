import type { Quest } from "@/features/quests/types/quest";

export type FocusScreenProps = {
  quest?: Quest | null;
  targetMinutes?: number | null;
  initialBlocks?: number;
  onQuit: () => void;
  onFinish: (addedMinutes: number, blocksCompleted: number, questId?: string) => Promise<void>;
};

export type FocusSessionRecord = {
  id: string;
  date: string; // "YYYY-MM-DD"
  timestamp: number;
  durationMinutes: number;
  blocksCompleted: number;
  targetMinutes: number | null;
  questId?: string;
  questTitle?: string;
};

export type DailyFocusStats = {
  date: string; // "YYYY-MM-DD"
  totalMinutes: number;
  blocksCompleted: number;
  sessionsCount: number;
};
