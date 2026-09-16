"use client";

import { useEffect, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { Period, PeriodFormData } from "../types/school";
import {
  SAMPLE_PERIODS,
  loadPeriods,
  savePeriods,
  sortPeriodsChronologically,
} from "../data/school-storage";
import {
  createPeriodInFirestore,
  deletePeriodInFirestore,
  loadSamplePeriodsToFirestore,
  subscribePeriods,
  updatePeriodInFirestore,
} from "../data/school-firestore";

export function usePeriodsData(userId?: string | null) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cached periods immediately and subscribe to Firestore when configured
  useEffect(() => {
    // 1. Immediate local cache load for instant zero-latency UI
    const frame = requestAnimationFrame(() => {
      const local = loadPeriods(userId);
      const initialLocal = local.length > 0 ? local : loadPeriods(null);
      if (initialLocal.length > 0) {
        setPeriods(initialLocal);
      }
      setIsLoaded(true);
    });

    // 2. If Firebase is not configured or user is not signed in, keep using local storage
    if (!isFirebaseConfigured() || !userId) {
      return () => cancelAnimationFrame(frame);
    }

    // 3. Listen to Firestore collection users/{userId}/periods
    const unsubscribe = subscribePeriods(
      userId,
      (sorted) => {
        setPeriods(sorted);
        savePeriods(sorted, userId);
        setIsLoaded(true);
      },
      (error) => {
        console.error("Firestore periods subscription error:", error);
        setPeriods(sortPeriodsChronologically(loadPeriods(userId)));
        setIsLoaded(true);
      },
    );

    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, [userId]);

  const addPeriod = (form: PeriodFormData) => {
    const name = form.name.trim();
    if (isFirebaseConfigured() && userId) {
      const newPeriod = createPeriodInFirestore(userId, form);
      const sorted = sortPeriodsChronologically([...periods, newPeriod]);
      setPeriods(sorted);
      savePeriods(sorted, userId);
    } else {
      const newPeriod: Period = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),
        name,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room.trim() || undefined,
        days: form.days,
        icon: form.icon,
      };
      const sorted = sortPeriodsChronologically([...periods, newPeriod]);
      setPeriods(sorted);
      savePeriods(sorted, userId);
    }
  };

  const updatePeriod = (id: string, form: PeriodFormData) => {
    const name = form.name.trim();
    if (isFirebaseConfigured() && userId) {
      updatePeriodInFirestore(userId, id, form);
    }

    const updated = periods.map((p) =>
      p.id === id
        ? {
            ...p,
            name,
            startTime: form.startTime,
            endTime: form.endTime,
            room: form.room.trim() || undefined,
            days: form.days,
            icon: form.icon,
          }
        : p,
    );
    const sorted = sortPeriodsChronologically(updated);
    setPeriods(sorted);
    savePeriods(sorted, userId);
  };

  const deletePeriod = (id: string) => {
    const updated = periods.filter((p) => p.id !== id);
    setPeriods(updated);
    savePeriods(updated, userId);

    if (isFirebaseConfigured() && userId) {
      deletePeriodInFirestore(userId, id);
    }
  };

  const loadSampleSchedule = async () => {
    if (isFirebaseConfigured() && userId) {
      const sampleWithIds: Period[] = SAMPLE_PERIODS.map((sample, idx) => ({
        ...sample,
        id: `sample-${Date.now()}-${idx}`,
      }));
      // optimistic update immediately
      const sorted = sortPeriodsChronologically(sampleWithIds);
      setPeriods(sorted);
      savePeriods(sorted, userId);

      try {
        const firestoreSamples = await loadSamplePeriodsToFirestore(userId, SAMPLE_PERIODS);
        const firestoreSorted = sortPeriodsChronologically(firestoreSamples);
        setPeriods(firestoreSorted);
        savePeriods(firestoreSorted, userId);
      } catch (err) {
        console.error("Failed to load sample periods to Firestore:", err);
      }
    } else {
      const sampleWithIds: Period[] = SAMPLE_PERIODS.map((sample, idx) => ({
        ...sample,
        id: `sample-${Date.now()}-${idx}`,
      }));
      const sorted = sortPeriodsChronologically(sampleWithIds);
      setPeriods(sorted);
      savePeriods(sorted, userId);
    }
  };

  return {
    periods,
    isLoaded,
    addPeriod,
    updatePeriod,
    deletePeriod,
    loadSampleSchedule,
  };
}
