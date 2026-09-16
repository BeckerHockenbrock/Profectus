"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
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
import type { DayOfWeek, Period, PeriodIconId } from "@/lib/school-types";
import {
  ALL_DAYS,
  PERIOD_ICONS,
  WEEKDAYS,
  calculateDurationMinutes,
  formatDuration,
  formatTime12Hour,
  getPeriodStatus,
  getTodayDayOfWeek,
  timeToMinutes,
} from "@/lib/school-types";
import {
  SAMPLE_PERIODS,
  loadPeriods,
  savePeriods,
  sortPeriodsChronologically,
} from "@/lib/school-storage";
import { useSheetSwipe } from "./use-sheet-swipe";

type SchoolViewProps = {
  userId?: string | null;
};

type PeriodFormData = {
  name: string;
  startTime: string;
  endTime: string;
  room: string;
  days: DayOfWeek[];
  icon: PeriodIconId;
};

const initialFormData: PeriodFormData = {
  name: "",
  startTime: "08:30",
  endTime: "09:25",
  room: "",
  days: WEEKDAYS,
  icon: "book",
};

export function PeriodIcon({
  name,
  className = "",
  size = 18,
}: {
  name?: PeriodIconId;
  className?: string;
  size?: number;
}) {
  switch (name) {
    case "calculator":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="16" y1="14" x2="16" y2="18" />
          <path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" />
        </svg>
      );
    case "flask":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 2v7.31L4.12 19.24A2 2 0 0 0 5.8 22h12.4a2 2 0 0 0 1.68-2.76L14 9.31V2" />
          <line x1="8.5" y1="2" x2="15.5" y2="2" />
          <line x1="6.5" y1="16" x2="17.5" y2="16" />
        </svg>
      );
    case "globe":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "laptop":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M2 20h20" />
        </svg>
      );
    case "palette":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="13.5" cy="6.5" r=".5" />
          <circle cx="17.5" cy="10.5" r=".5" />
          <circle cx="8.5" cy="7.5" r=".5" />
          <circle cx="6.5" cy="12.5" r=".5" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      );
    case "music":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case "trophy":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      );
    case "pencil":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      );
    case "bell":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case "coffee":
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      );
    case "book":
    default:
      return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
  }
}

function PeriodDetailModal({
  period,
  liveStatus,
  todayDay,
  onClose,
  onEdit,
  onDelete,
}: {
  period: Period;
  liveStatus: { status: "current" | "next" | "upcoming" | "past"; minutesUntil?: number; minutesRemaining?: number } | null;
  todayDay: DayOfWeek;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { sheetRef, scrimRef, dragHandleProps } = useSheetSwipe({ onClose });

  return (
    <div
      ref={scrimRef as React.RefObject<HTMLDivElement>}
      className="detailModalScrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="period-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={sheetRef as React.RefObject<HTMLElement>}
        className="detailModalSheet"
      >
        <div className="sheetHandleArea" {...dragHandleProps}>
          <div className="sheetHandle" aria-hidden="true" />
        </div>

        <header className="detailModalHeader" {...dragHandleProps}>
          <div className="periodDetailHeaderBadge">
            <PeriodIcon name={period.icon || "book"} size={18} />
            <span>{formatDuration(calculateDurationMinutes(period.startTime, period.endTime))}</span>
          </div>
          <button
            type="button"
            className="detailCloseButton"
            onClick={onClose}
            aria-label="Close details"
          >
            ×
          </button>
        </header>

        <div className="detailModalBody">
          <h2 id="period-detail-title" className="detailTitle">
            {period.name}
          </h2>

          {liveStatus ? (
            <div className="detailMetaRow">
              {liveStatus.status === "current" ? (
                <span className="detailStatusPill isCompleted">
                  In Session · {liveStatus.minutesRemaining}m remaining
                </span>
              ) : liveStatus.status === "next" ? (
                <span className="detailStatusPill inProgress">
                  Up Next · Starts in {liveStatus.minutesUntil}m
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="periodDetailGrid">
            <div className="periodDetailItem">
              <span className="periodDetailLabel">Time</span>
              <strong className="periodDetailValue">
                {formatTime12Hour(period.startTime)} – {formatTime12Hour(period.endTime)}
              </strong>
            </div>

            <div className="periodDetailItem">
              <span className="periodDetailLabel">Room / Location</span>
              <strong className="periodDetailValue">
                {period.room ? period.room : "No room set"}
              </strong>
            </div>

            <div className="periodDetailItem fullWidth">
              <span className="periodDetailLabel">Active Days</span>
              <div className="periodDetailDays">
                {ALL_DAYS.map((d) => {
                  const active = (period.days || WEEKDAYS).includes(d);
                  const isToday = d === todayDay;
                  return (
                    <span
                      key={d}
                      className={`detailDayPill ${active ? "isActive" : ""} ${isToday && active ? "isToday" : ""}`}
                    >
                      {d}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="periodDetailActions">
            <button
              type="button"
              className="schoolPrimaryButton fullWidth"
              onClick={onEdit}
            >
              Edit Period
            </button>

            <button
              type="button"
              className="periodDeleteDirectBtn"
              onClick={onDelete}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span>Delete Period</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function SchoolView({ userId }: SchoolViewProps) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [form, setForm] = useState<PeriodFormData>(initialFormData);
  const [formError, setFormError] = useState("");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

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
    let isFirstSnapshot = true;
    const db = getFirebaseDb();
    const periodsCol = collection(db, "users", userId, "periods");

    const unsubscribe = onSnapshot(
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

  // Update live clock every 30 seconds for dynamic period status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const closeFormSheet = () => {
    setSheetOpen(false);
    setEditingPeriodId(null);
    setForm(initialFormData);
    setFormError("");
  };

  const {
    sheetRef: formSheetRef,
    scrimRef: formScrimRef,
    dragHandleProps: formDragHandleProps,
  } = useSheetSwipe({ onClose: closeFormSheet });

  const todayDay = useMemo(() => getTodayDayOfWeek(currentTime), [currentTime]);

  const selectedPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId) ?? null;
  }, [periods, selectedPeriodId]);

  const selectedLiveStatus = useMemo(() => {
    if (!selectedPeriod) return null;
    return getPeriodStatus(selectedPeriod, currentTime);
  }, [selectedPeriod, currentTime]);

  // Determine current active period or next upcoming period today
  const { currentPeriod, nextPeriod } = useMemo(() => {
    let current: { period: Period; minutesRemaining?: number } | null = null;
    let next: { period: Period; minutesUntil?: number } | null = null;

    for (const p of periods) {
      const live = getPeriodStatus(p, currentTime);
      if (!live) continue;
      if (live.status === "current") {
        current = { period: p, minutesRemaining: live.minutesRemaining };
      } else if (live.status === "next" && !next) {
        next = { period: p, minutesUntil: live.minutesUntil };
      } else if (live.status === "upcoming" && !next) {
        next = { period: p, minutesUntil: live.minutesUntil };
      }
    }
    return { currentPeriod: current, nextPeriod: next };
  }, [periods, currentTime]);

  const handleOpenAdd = () => {
    const nextPeriodNum = periods.length + 1;
    setEditingPeriodId(null);
    setForm({
      name: `Period ${nextPeriodNum}`,
      startTime: periods.length > 0 ? periods[periods.length - 1].endTime : "08:30",
      endTime: periods.length > 0 ? calculateNextEndTime(periods[periods.length - 1].endTime, 50) : "09:20",
      room: "",
      days: WEEKDAYS,
      icon: "book",
    });
    setFormError("");
    setSheetOpen(true);
  };

  const handleOpenEdit = (period: Period) => {
    setEditingPeriodId(period.id);
    setForm({
      name: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
      room: period.room || "",
      days: period.days && period.days.length > 0 ? period.days : WEEKDAYS,
      icon: period.icon || "book",
    });
    setFormError("");
    setSheetOpen(true);
  };

  const handleToggleDay = (day: DayOfWeek) => {
    setForm((prev) => {
      const exists = prev.days.includes(day);
      if (exists) {
        if (prev.days.length === 1) return prev;
        return { ...prev, days: prev.days.filter((d) => d !== day) };
      }
      return { ...prev, days: [...prev.days, day] };
    });
  };

  const handleSelectAllDays = () => {
    setForm((prev) => ({ ...prev, days: ALL_DAYS }));
  };

  const handleSelectWeekdays = () => {
    setForm((prev) => ({ ...prev, days: WEEKDAYS }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError("Please enter a period title or name.");
      return;
    }
    if (!form.startTime || !form.endTime) {
      setFormError("Please set both start and end times.");
      return;
    }
    if (timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
      setFormError("End time must be after start time.");
      return;
    }
    if (form.days.length === 0) {
      setFormError("Please choose at least one day.");
      return;
    }

    if (isFirebaseConfigured() && userId) {
      const db = getFirebaseDb();
      if (editingPeriodId) {
        const periodRef = doc(db, "users", userId, "periods", editingPeriodId);
        updateDoc(periodRef, {
          name,
          startTime: form.startTime,
          endTime: form.endTime,
          room: form.room.trim() || "",
          days: form.days,
          icon: form.icon,
          updatedAt: Date.now(),
        }).catch((err) => {
          console.error("Failed to update period in Firestore:", err);
        });

        const updated = periods.map((p) =>
          p.id === editingPeriodId
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
      } else {
        const periodsCol = collection(db, "users", userId, "periods");
        const newRef = doc(periodsCol);
        const newPeriod: Period = {
          id: newRef.id,
          name,
          startTime: form.startTime,
          endTime: form.endTime,
          room: form.room.trim() || undefined,
          days: form.days,
          icon: form.icon,
        };

        setDoc(newRef, {
          name,
          startTime: form.startTime,
          endTime: form.endTime,
          room: form.room.trim() || "",
          days: form.days,
          icon: form.icon,
          createdAt: Date.now(),
        }).catch((err) => {
          console.error("Failed to create period in Firestore:", err);
        });

        const sorted = sortPeriodsChronologically([...periods, newPeriod]);
        setPeriods(sorted);
        savePeriods(sorted, userId);
      }
    } else {
      if (editingPeriodId) {
        const updated = periods.map((p) =>
          p.id === editingPeriodId
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
      } else {
        const newPeriod: Period = {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
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
    }

    closeFormSheet();
  };

  // Direct delete without confirmation prompt per user request
  const handleDelete = (id: string) => {
    const updated = periods.filter((p) => p.id !== id);
    setPeriods(updated);
    savePeriods(updated, userId);
    if (selectedPeriodId === id) {
      setSelectedPeriodId(null);
    }

    if (isFirebaseConfigured() && userId) {
      const db = getFirebaseDb();
      deleteDoc(doc(db, "users", userId, "periods", id)).catch((err) => {
        console.error("Failed to delete period from Firestore:", err);
      });
    }
  };

  const handleLoadSample = async () => {
    if (isFirebaseConfigured() && userId) {
      const db = getFirebaseDb();
      const batch = writeBatch(db);
      const periodsCol = collection(db, "users", userId, "periods");
      const sampleWithIds: Period[] = [];

      SAMPLE_PERIODS.forEach((sample, idx) => {
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

      const sorted = sortPeriodsChronologically(sampleWithIds);
      setPeriods(sorted);
      savePeriods(sorted, userId);

      try {
        await batch.commit();
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

  return (
    <div className="schoolContent">
      {/* Header section */}
      <section className="schoolHeader" aria-label="School Schedule Header">
        <div className="schoolHeaderTop">
          <div>
            <span className="schoolSubhead">Schedule</span>
            <h1 className="schoolHeading">School</h1>
          </div>
          <button
            type="button"
            className="schoolAddButton"
            onClick={handleOpenAdd}
            aria-label="Add new period"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add period</span>
          </button>
        </div>

        {/* Live Day & Period Status Banner */}
        {currentPeriod ? (
          <div
            className="schoolLiveBanner isLive"
            role="status"
            aria-live="polite"
            onClick={() => setSelectedPeriodId(currentPeriod.period.id)}
            style={{ cursor: "pointer" }}
            title="Click to view details"
          >
            <div className="livePulseDot" aria-hidden="true" />
            <div className="liveBannerInfo">
              <span className="liveBannerTag">IN SESSION NOW</span>
              <strong className="liveBannerTitle">{currentPeriod.period.name}</strong>
              <span className="liveBannerMeta">
                Ends at {formatTime12Hour(currentPeriod.period.endTime)}
                {currentPeriod.minutesRemaining !== undefined ? ` · ${currentPeriod.minutesRemaining}m left` : ""}
                {currentPeriod.period.room ? ` · 📍 ${currentPeriod.period.room}` : ""}
              </span>
            </div>
          </div>
        ) : nextPeriod ? (
          <div
            className="schoolLiveBanner isUpcoming"
            role="status"
            aria-live="polite"
            onClick={() => setSelectedPeriodId(nextPeriod.period.id)}
            style={{ cursor: "pointer" }}
            title="Click to view details"
          >
            <div className="upcomingDot" aria-hidden="true" />
            <div className="liveBannerInfo">
              <span className="upcomingBannerTag">UP NEXT TODAY</span>
              <strong className="liveBannerTitle">{nextPeriod.period.name}</strong>
              <span className="liveBannerMeta">
                Starts at {formatTime12Hour(nextPeriod.period.startTime)}
                {nextPeriod.minutesUntil !== undefined ? ` · in ${nextPeriod.minutesUntil}m` : ""}
                {nextPeriod.period.room ? ` · 📍 ${nextPeriod.period.room}` : ""}
              </span>
            </div>
          </div>
        ) : null}
      </section>

      {/* Main Period Schedule List */}
      <section className="schoolPeriodSection" aria-label="Periods List">
        <div className="schoolSectionTitleRow">
          <h2>Daily Periods</h2>
          {periods.length > 0 ? (
            <span className="periodCountBadge">{periods.length} {periods.length === 1 ? "period" : "periods"}</span>
          ) : null}
        </div>

        {!isLoaded ? (
          <div className="emptyState">Loading schedule…</div>
        ) : periods.length === 0 ? (
          <div className="schoolEmptyState">
            <div className="emptyIconWrapper">
              <PeriodIcon name="book" size={32} />
            </div>
            <h3>No periods yet</h3>
            <p>Add your class periods and when they take place so your day is organized.</p>
            <div className="emptyActions">
              <button
                type="button"
                className="schoolPrimaryButton"
                onClick={handleOpenAdd}
              >
                + Add your first period
              </button>
              <button
                type="button"
                className="schoolSecondaryButton"
                onClick={handleLoadSample}
              >
                Load sample schedule
              </button>
            </div>
          </div>
        ) : (
          <div className="periodList">
            {periods.map((period) => {
              const liveStatus = getPeriodStatus(period, currentTime);
              const isCurrent = liveStatus?.status === "current";
              const isNext = liveStatus?.status === "next";

              return (
                <article
                  key={period.id}
                  className={`periodCard ${isCurrent ? "isPeriodCurrent" : ""} ${isNext ? "isPeriodNext" : ""}`}
                  onClick={() => setSelectedPeriodId(period.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${period.name}, from ${formatTime12Hour(period.startTime)} to ${formatTime12Hour(period.endTime)}. Tap to view details.`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedPeriodId(period.id);
                    }
                  }}
                >
                  <div className="periodIconBadge" aria-hidden="true">
                    <PeriodIcon name={period.icon || "book"} size={18} />
                  </div>

                  <div className="periodCardContent">
                    <h3 className="periodName">{period.name}</h3>
                    <div className="periodCardMeta">
                      <span className="periodTimeRange">
                        {formatTime12Hour(period.startTime)} – {formatTime12Hour(period.endTime)}
                      </span>
                      {period.room ? (
                        <span className="periodRoomMini">· {period.room}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="periodCardRight">
                    {isCurrent ? (
                      <span className="statusBadge inSession">In session</span>
                    ) : isNext ? (
                      <span className="statusBadge upNext">Up next</span>
                    ) : null}
                    <span className="periodCardChevron" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Period Details Modal Sheet */}
      {selectedPeriod ? (
        <PeriodDetailModal
          period={selectedPeriod}
          liveStatus={selectedLiveStatus}
          todayDay={todayDay}
          onClose={() => setSelectedPeriodId(null)}
          onEdit={() => {
            const toEdit = selectedPeriod;
            setSelectedPeriodId(null);
            handleOpenEdit(toEdit);
          }}
          onDelete={() => {
            handleDelete(selectedPeriod.id);
          }}
        />
      ) : null}

      {/* Add / Edit Period Bottom Sheet */}
      <div
        className="sheetLayer"
        data-open={sheetOpen}
        aria-hidden={!sheetOpen}
        inert={!sheetOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape") closeFormSheet();
        }}
      >
        <button
          ref={formScrimRef as React.RefObject<HTMLButtonElement>}
          className="sheetScrim"
          type="button"
          aria-label="Close form"
          onClick={closeFormSheet}
        />
        <section
          ref={formSheetRef as React.RefObject<HTMLElement>}
          className="sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="period-sheet-title"
        >
          <div className="sheetHandleArea" {...formDragHandleProps}>
            <div className="sheetHandle" aria-hidden="true" />
          </div>
          <div className="sheetHeading" {...formDragHandleProps}>
            <div>
              <h2 id="period-sheet-title">
                {editingPeriodId ? "Edit Period" : "New Period"}
              </h2>
            </div>
            <button
              className="closeButton"
              type="button"
              onClick={closeFormSheet}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {formError ? <p className="formError" role="alert">{formError}</p> : null}

            <label>
              Period title or subject
              <input
                required
                autoFocus
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Period 1: AP Chemistry, Math, Advisory…"
              />
            </label>

            {/* Icon Picker */}
            <div className="iconSelectionGroup">
              <span className="daySelectionLabel">Choose icon</span>
              <div className="iconPickerGrid" role="radiogroup" aria-label="Choose subject icon">
                {PERIOD_ICONS.map(({ id, label }) => {
                  const isSelected = form.icon === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`iconPickerOption ${isSelected ? "isSelected" : ""}`}
                      onClick={() => setForm((prev) => ({ ...prev, icon: id }))}
                      aria-checked={isSelected}
                      role="radio"
                      title={label}
                    >
                      <PeriodIcon name={id} size={18} />
                      <span className="iconPickerLabel">{id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="formTimeGrid">
              <label className="formTimeField">
                <span>Start time</span>
                <input
                  type="time"
                  required
                  className="formTimeInput"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm({ ...form, startTime: event.target.value })
                  }
                />
              </label>

              <label className="formTimeField">
                <span>End time</span>
                <input
                  type="time"
                  required
                  className="formTimeInput"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm({ ...form, endTime: event.target.value })
                  }
                />
              </label>
            </div>

            <label>
              Room or location <span>Optional</span>
              <input
                value={form.room}
                onChange={(event) =>
                  setForm({ ...form, room: event.target.value })
                }
                placeholder="e.g. Room 204, Building C, Gymnasium…"
              />
            </label>

            <div className="daySelectionGroup">
              <div className="daySelectionHeader">
                <span className="daySelectionLabel">Days active</span>
                <div className="dayPresets">
                  <button
                    type="button"
                    className="dayPresetBtn"
                    onClick={handleSelectWeekdays}
                  >
                    Weekdays
                  </button>
                  <button
                    type="button"
                    className="dayPresetBtn"
                    onClick={handleSelectAllDays}
                  >
                    All days
                  </button>
                </div>
              </div>

              <div className="dayPillsRow" role="group" aria-label="Select days">
                {ALL_DAYS.map((day) => {
                  const isSelected = form.days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`daySelectPill ${isSelected ? "isSelected" : ""}`}
                      onClick={() => handleToggleDay(day)}
                      aria-pressed={isSelected}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <button className="saveButton" type="submit">
              {editingPeriodId ? "Save changes" : "Add period"}
            </button>

            {editingPeriodId ? (
              <button
                type="button"
                className="periodDeleteDirectBtn"
                style={{ marginTop: "0.25rem" }}
                onClick={() => {
                  handleDelete(editingPeriodId);
                  closeFormSheet();
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                <span>Delete this period</span>
              </button>
            ) : null}
          </form>
        </section>
      </div>
    </div>
  );
}

function calculateNextEndTime(startTime: string, durationMinutes: number): string {
  const mins = timeToMinutes(startTime) + durationMinutes;
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
