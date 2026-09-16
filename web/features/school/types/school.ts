export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export const ALL_DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export type PeriodIconId =
  | "book"
  | "calculator"
  | "flask"
  | "globe"
  | "laptop"
  | "palette"
  | "music"
  | "trophy"
  | "pencil"
  | "bell"
  | "coffee";

export const PERIOD_ICONS: { id: PeriodIconId; label: string }[] = [
  { id: "book", label: "Reading & English" },
  { id: "calculator", label: "Math & STEM" },
  { id: "flask", label: "Science & Lab" },
  { id: "globe", label: "History & Social Studies" },
  { id: "laptop", label: "Computer & Tech" },
  { id: "palette", label: "Art & Design" },
  { id: "music", label: "Music & Band" },
  { id: "trophy", label: "PE & Sports" },
  { id: "pencil", label: "Writing & Study" },
  { id: "bell", label: "Homeroom & Advisory" },
  { id: "coffee", label: "Break & Lunch" },
];

export type Period = {
  id: string;
  name: string;
  startTime: string; // "HH:mm" 24-hour format
  endTime: string;   // "HH:mm" 24-hour format
  room?: string;
  days?: DayOfWeek[];
  color?: string;
  icon?: PeriodIconId;
};

export type PeriodFormData = {
  name: string;
  startTime: string;
  endTime: string;
  room: string;
  days: DayOfWeek[];
  icon: PeriodIconId;
};

export type PeriodFormInput = PeriodFormData;

export type PeriodLiveStatus = "current" | "next" | "upcoming" | "past";

export type PeriodStatusInfo = {
  status: PeriodLiveStatus;
  minutesUntil?: number;
  minutesRemaining?: number;
};
