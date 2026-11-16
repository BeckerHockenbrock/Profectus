import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { DailyBrief } from "../types/brief";

export function subscribeBrief(
  userId: string,
  date: string,
  onData: (brief: DailyBrief | null) => void,
  onError: (err: unknown) => void,
): () => void {
  const database = getFirebaseDb();
  const briefRef = doc(database, "users", userId, "briefs", date);

  return onSnapshot(
    briefRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      const data = snapshot.data();
      onData({
        id: snapshot.id,
        title: String(data.title ?? ""),
        body: String(data.body ?? ""),
        updatedAt: Number(data.updatedAt ?? 0),
        updatedBy: data.updatedBy === "user" ? "user" : "bot",
      });
    },
    onError,
  );
}

export async function saveBriefInFirestore(
  userId: string,
  date: string,
  input: { title: string; body: string; updatedBy: "bot" | "user" },
): Promise<void> {
  const database = getFirebaseDb();
  await setDoc(
    doc(database, "users", userId, "briefs", date),
    {
      title: input.title,
      body: input.body,
      updatedAt: Date.now(),
      updatedBy: input.updatedBy,
    },
    { merge: true },
  );
}
