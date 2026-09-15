import { getQuests } from "@/lib/database";
import QuestApp from "./quest-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Home() {
  const today = toISODate(new Date());
  const initialQuests = getQuests();

  return <QuestApp initialQuests={initialQuests} today={today} />;
}
