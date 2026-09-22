import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import type { FocusSessionRecord } from "../types/focus";
import { loadFocusSessions, saveFocusSession } from "./focus-storage";

export function subscribeFocusSessions(
  userId: string,
  onData: (sessions: FocusSessionRecord[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  if (!isFirebaseConfigured() || !userId) {
    return () => {};
  }

  const db = getFirebaseDb();
  const sessionsCol = collection(db, "users", userId, "focusSessions");
  const sessionsQuery = query(sessionsCol, orderBy("timestamp", "desc"), limit(100));

  return onSnapshot(
    sessionsQuery,
    (snapshot) => {
      if (snapshot.empty) {
        // Fallback to local cache if Firestore has no sessions yet
        const cached = loadFocusSessions(userId);
        onData(cached);
        return;
      }

      const fetched: FocusSessionRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          date: String(data.date ?? ""),
          timestamp: typeof data.timestamp === "number" ? data.timestamp : Date.now(),
          durationMinutes: typeof data.durationMinutes === "number" ? data.durationMinutes : 0,
          blocksCompleted: typeof data.blocksCompleted === "number" ? data.blocksCompleted : 0,
          targetMinutes: typeof data.targetMinutes === "number" ? data.targetMinutes : null,
          questId: data.questId ? String(data.questId) : undefined,
          questTitle: data.questTitle ? String(data.questTitle) : undefined,
        };
      });

      onData(fetched);
    },
    (err) => {
      console.warn("Could not sync focus sessions from Firestore; using local cache", err);
      onData(loadFocusSessions(userId));
      if (onError) onError(err);
    },
  );
}

export async function recordFocusSession(
  userId: string | null | undefined,
  session: FocusSessionRecord,
): Promise<FocusSessionRecord[]> {
  // Always update local storage first for snappy offline responsiveness
  const updatedLocal = saveFocusSession(session, userId);

  if (isFirebaseConfigured() && userId) {
    try {
      const db = getFirebaseDb();
      const sessionDocRef = doc(db, "users", userId, "focusSessions", session.id);
      await setDoc(sessionDocRef, {
        date: session.date,
        timestamp: session.timestamp,
        durationMinutes: session.durationMinutes,
        blocksCompleted: session.blocksCompleted,
        targetMinutes: session.targetMinutes,
        questId: session.questId ?? null,
        questTitle: session.questTitle ?? null,
      });
    } catch (err) {
      console.warn("Could not write focus session to Firestore:", err);
    }
  }

  return updatedLocal;
}
