export type DailyBrief = {
  id: string; // YYYY-MM-DD
  title: string;
  body: string;
  updatedAt: number;
  updatedBy: "bot" | "user";
};

export type BriefWriteInput = {
  title?: string;
  body: string;
  date?: string;
};
