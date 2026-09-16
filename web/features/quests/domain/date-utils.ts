export function addDays(isoDate: string, daysToAdd: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day + daysToAdd);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function formatDueDate(dueDate: string, today: string) {
  if (!dueDate) return "No date";
  if (dueDate === today) return "Today";
  if (dueDate === addDays(today, 1)) return "Tmrw";

  const [year, month, day] = dueDate.split("-");
  const currentYear = today.slice(0, 4);
  return year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;
}

export function formatDueDateDetail(dueDate: string, today: string) {
  if (!dueDate) return "No due date";
  if (dueDate === today) return "Due today";
  if (dueDate === addDays(today, 1)) return "Due tomorrow";

  const [year, month, day] = dueDate.split("-");
  const currentYear = today.slice(0, 4);
  const formatted = year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;
  return `Due ${formatted}`;
}
