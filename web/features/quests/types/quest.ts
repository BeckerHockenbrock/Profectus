export type Quest = {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  completed: boolean;
  focusMinutes: number;
  order?: number;
};

export type QuestView = "all" | "categories" | "dates";

export type NewQuestInput = {
  title: string;
  description: string;
  category: string;
  dueDate: string;
  order?: number;
};

export type QuestForm = {
  title: string;
  description: string;
  category: string;
  dueDate: string;
};
