import QuestApp, { type Quest } from "./quest-app";

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromToday(daysToAdd: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return toISODate(date);
}

export default function Home() {
  const today = dateFromToday(0);
  const initialQuests: Quest[] = [
    {
      id: 1,
      title: "Outline compiler project report",
      description: "Turn the terminal prototype into a short feature summary.",
      category: "CIS 25",
      dueDate: today,
      completed: false,
      focusMinutes: 38,
    },
    {
      id: 2,
      title: "Review recursion notes",
      description: "Work through the two examples from class.",
      category: "CIS 25",
      dueDate: dateFromToday(1),
      completed: false,
      focusMinutes: 21,
    },
    {
      id: 3,
      title: "Reply to shift request",
      description: "Confirm Friday availability with the team.",
      category: "Work",
      dueDate: dateFromToday(1),
      completed: true,
      focusMinutes: 12,
    },
    {
      id: 4,
      title: "Submit transfer documents",
      description: "Double-check the application checklist before sending.",
      category: "College",
      dueDate: dateFromToday(5),
      completed: false,
      focusMinutes: 27,
    },
  ];

  return <QuestApp initialQuests={initialQuests} today={today} />;
}
