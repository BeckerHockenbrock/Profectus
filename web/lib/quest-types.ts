export type Quest = {
  id: string;
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
