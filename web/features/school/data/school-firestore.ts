import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import type { DayOfWeek, Period, PeriodFormData, PeriodIconId } from "../types/school";
import { WEEKDAYS } from "../types/school";
import { loadPeriods, sortPeriodsChronologically } from "./school-storage";

export function subscribePeriods(
  userId: string,
  onData: (periods: Period[]) => void,
  onError: (error: unknown) => void,
): () => void {
  if (!isFirebaseConfigured() || !userId) {
    return () => {};
  }

  let isFirstSnapshot = true;
  const db = getFirebaseDb();
  const periodsCol = collection(db, "users", userId, "periods");

  return onSnapshot(
    periodsCol,
    (snapshot) => {
      // Automatic migration: If Firestore is empty on initial check, upload local periods
      if (snapshot.empty && isFirstSnapshot) {
        isFirstSnapshot = false;
        const cached = loadPeriods(userId);
        const toMigrate = cached.length > 0 ? cached : loadPeriods(null);
        if (toMigrate.length > 0) {
          const batch = writeBatch(db);
          toMigrate.forEach((p, idx) => {
            const newRef = doc(periodsCol);
            batch.set(newRef, {
              name: p.name,
              startTime: p.startTime,
              endTime: p.endTime,
              room: p.room || "",
              days: p.days || WEEKDAYS,
              icon: p.icon || "book",
              createdAt: Date.now() + idx,
            });
          });
          batch.commit().catch((err) => {
            console.error("Failed to migrate local periods to Firestore:", err);
          });
          return;
        }
      }
      isFirstSnapshot = false;

      const fetched: Period[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: String(data.name ?? ""),
          startTime: String(data.startTime ?? ""),
          endTime: String(data.endTime ?? ""),
          room: data.room ? String(data.room) : undefined,
          days: Array.isArray(data.days) ? (data.days as DayOfWeek[]) : WEEKDAYS,
          color: data.color ? String(data.color) : undefined,
          icon: data.icon ? (data.icon as PeriodIconId) : "book",
        };
      });

      const sorted = sortPeriodsChronologically(fetched);
      onData(sorted);
    },
    onError,
  );
}

export function createPeriodInFirestore(
  userId: string,
  form: PeriodFormData,
): Period {
  const db = getFirebaseDb();
  const periodsCol = collection(db, "users", userId, "periods");
  const newRef = doc(periodsCol);
  const newPeriod: Period = {
    id: newRef.id,
    name: form.name.trim(),
    startTime: form.startTime,
    endTime: form.endTime,
    room: form.room.trim() || undefined,
    days: form.days,
    icon: form.icon,
  };

  setDoc(newRef, {
    name: newPeriod.name,
    startTime: newPeriod.startTime,
    endTime: newPeriod.endTime,
    room: form.room.trim() || "",
    days: form.days,
    icon: form.icon,
    createdAt: Date.now(),
  }).catch((err) => {
    console.error("Failed to create period in Firestore:", err);
  });

  return newPeriod;
}

export function updatePeriodInFirestore(
  userId: string,
  periodId: string,
  form: PeriodFormData,
): void {
  const db = getFirebaseDb();
  const periodRef = doc(db, "users", userId, "periods", periodId);

  updateDoc(periodRef, {
    name: form.name.trim(),
    startTime: form.startTime,
    endTime: form.endTime,
    room: form.room.trim() || "",
    days: form.days,
    icon: form.icon,
    updatedAt: Date.now(),
  }).catch((err) => {
    console.error("Failed to update period in Firestore:", err);
  });
}

export function deletePeriodInFirestore(userId: string, periodId: string): void {
  const db = getFirebaseDb();
  deleteDoc(doc(db, "users", userId, "periods", periodId)).catch((err) => {
    console.error("Failed to delete period from Firestore:", err);
  });
}

export async function loadSamplePeriodsToFirestore(
  userId: string,
  samples: Omit<Period, "id">[],
): Promise<Period[]> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const periodsCol = collection(db, "users", userId, "periods");
  const sampleWithIds: Period[] = [];

  samples.forEach((sample, idx) => {
    const newRef = doc(periodsCol);
    batch.set(newRef, {
      name: sample.name,
      startTime: sample.startTime,
      endTime: sample.endTime,
      room: sample.room || "",
      days: sample.days || WEEKDAYS,
      icon: sample.icon || "book",
      createdAt: Date.now() + idx,
    });
    sampleWithIds.push({
      ...sample,
      id: newRef.id,
    });
  });

  await batch.commit();
  return sampleWithIds;
}
