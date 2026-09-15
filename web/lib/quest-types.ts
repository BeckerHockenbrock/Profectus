export type Quest = {
  id: number;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  completed: boolean;
  focusMinutes: number;
};

export type NewQuestInput = {
  title: string;
  description: string;
  category: string;
  dueDate: string;
};
