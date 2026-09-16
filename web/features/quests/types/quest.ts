export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Quest = {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  completed: boolean;
  focusMinutes: number;
  order?: number;
  subtasks?: Subtask[];
};

export type QuestView = "all" | "categories" | "dates";

export type NewQuestInput = {
  title: string;
  description: string;
  category: string;
  dueDate: string;
  order?: number;
  subtasks?: Subtask[];
};

export type QuestForm = {
  title: string;
  description: string;
  category: string;
  dueDate: string;
  subtasks?: Subtask[];
};
