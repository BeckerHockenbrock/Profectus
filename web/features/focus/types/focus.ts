import type { Quest } from "@/features/quests/types/quest";

export type FocusScreenProps = {
  quest: Quest;
  onQuit: () => void;
  onFinish: (questId: string, addedMinutes: number) => Promise<void>;
};
