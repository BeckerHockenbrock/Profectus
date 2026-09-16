"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import type { Quest } from "@/lib/quest-types";
import { LiquidDock } from "./liquid-dock";
import { SchoolView } from "./school-view";
import { StatsView } from "./stats-view";
import { TaskDetailModal } from "./task-detail-modal";
import { useSheetSwipe } from "./use-sheet-swipe";

type QuestAppProps = {
  today: string;
};

type QuestForm = {
  title: string;
  description: string;
  category: string;
  dueDate: string;
};

const emptyForm: QuestForm = {
  title: "",
  description: "",
  category: "",
  dueDate: "",
};

function HomeScreenHint({ onDismiss }: { onDismiss: () => void }) {
  return (
    <aside className="homeScreenHint" aria-label="Add Todo Quest to your home screen">
      <div>
        <strong>Use Todo Quest like an app</strong>
        <p>Open your browser menu, then choose <b>Share</b> and <b>Add to Home Screen</b>.</p>
      </div>
      <button className="hintDismissButton" type="button" onClick={onDismiss} aria-label="Dismiss home screen hint">
        Not now
      </button>
    </aside>
  );
}

function addDays(isoDate: string, daysToAdd: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day + daysToAdd);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function formatDueDate(dueDate: string, today: string) {
  if (!dueDate) return "No date";
  if (dueDate === today) return "Today";
  if (dueDate === addDays(today, 1)) return "Tmrw";

  const [year, month, day] = dueDate.split("-");
  const currentYear = today.slice(0, 4);
  return year === currentYear ? `${month}/${day}` : `${month}/${day}/${year}`;
}

function QuestCard({
  quest,
  today,
  onToggle,
  onSelect,
  isUpdating,
  isDragging,
  transformY,
  onPointerDown,
}: {
  quest: Quest;
  today: string;
  onToggle: (id: string) => void;
  onSelect: (quest: Quest) => void;
  isUpdating: boolean;
  isDragging?: boolean;
  transformY?: number;
  onPointerDown?: (event: React.PointerEvent, questId: string, isHandle?: boolean) => void;
}) {
  return (
    <article
      className={`questCard${quest.completed ? " isComplete" : ""}`}
      data-quest-id={quest.id}
      data-dragging={isDragging ? "true" : undefined}
      style={{
        transform: isDragging
          ? `translateY(${transformY ?? 0}px) scale(1.025)`
          : transformY && transformY !== 0
            ? `translateY(${transformY}px)`
            : undefined,
        zIndex: isDragging ? 80 : undefined,
        transition: isDragging ? "none" : "transform 180ms cubic-bezier(0.2, 0.9, 0.3, 1)",
      }}
      role="button"
      tabIndex={0}
      onPointerDown={(event) => onPointerDown?.(event, quest.id, false)}
      onClick={() => onSelect(quest)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(quest);
        }
      }}
      aria-label={`${quest.title}, ${quest.completed ? "completed" : "incomplete"}. Hold or drag grip to reorder, or click to view details`}
    >
      <button
        className="completeButton"
        type="button"
        aria-label={quest.completed ? `Mark ${quest.title} as incomplete` : `Mark ${quest.title} as completed`}
        aria-pressed={quest.completed}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(quest.id);
        }}
        disabled={isUpdating}
      >
        <span className="checkIcon" aria-hidden="true">
          {quest.completed ? "✓" : ""}
        </span>
      </button>

      <div className="questContent">
        <h3 className="questTitle">{quest.title}</h3>
        <div className="questMeta">
          <span className={quest.dueDate === today ? "dueLabel isToday" : "dueLabel"}>
            <svg
              className="dueCalendarIcon"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{formatDueDate(quest.dueDate, today)}</span>
          </span>
          <span className="categoryPill">{quest.category}</span>
          {quest.focusMinutes > 0 ? (
            <span className="questXPBadge">{quest.focusMinutes}m</span>
          ) : null}
        </div>
      </div>

      <div className="questCardActionsRow">
        {onPointerDown ? (
          <span
            className="dragGripHandle"
            aria-label="Drag to reorder"
            title="Drag to reorder"
            onPointerDown={(event) => {
              event.stopPropagation();
              onPointerDown?.(event, quest.id, true);
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="9" cy="5" r="1.75" />
              <circle cx="15" cy="5" r="1.75" />
              <circle cx="9" cy="12" r="1.75" />
              <circle cx="15" cy="12" r="1.75" />
              <circle cx="9" cy="19" r="1.75" />
              <circle cx="15" cy="19" r="1.75" />
            </svg>
          </span>
        ) : null}

        <span className="questCardChevron" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </article>
  );
}

function formatTimerDigits(totalMilliseconds: number) {
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    const hh = String(hours).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

const SISYPHUS_FOCUS_FRAMES = Array.from(
  { length: 12 },
  (_, index) => `/focus/sisyphus/frame-${String(index + 1).padStart(2, "0")}.png`,
);
const SISYPHUS_FRAME_DURATION_MS = 120;

function SisyphusFrameAnimation({ isPaused }: { isPaused: boolean }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [sequenceReady, setSequenceReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const animationFrameRef = useRef<number | null>(null);
  const previousTimestampRef = useRef<number | null>(null);
  const accumulatedFrameMsRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion || sequenceReady) return;

    let cancelled = false;
    const preloadedFrames = SISYPHUS_FOCUS_FRAMES.map((src) => {
      const image = new window.Image();
      image.src = src;
      return image;
    });

    void Promise.all(preloadedFrames.map((image) => image.decode())).then(
      () => {
        if (!cancelled) setSequenceReady(true);
      },
      () => {
        if (!cancelled) setSequenceReady(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [prefersReducedMotion, sequenceReady]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);

  const framesReady = prefersReducedMotion || sequenceReady;

  useEffect(() => {
    if (!sequenceReady || isPaused || prefersReducedMotion) {
      previousTimestampRef.current = null;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      const previousTimestamp = previousTimestampRef.current;
      previousTimestampRef.current = timestamp;

      if (previousTimestamp !== null) {
        accumulatedFrameMsRef.current += Math.min(timestamp - previousTimestamp, 250);
        const framesToAdvance = Math.floor(
          accumulatedFrameMsRef.current / SISYPHUS_FRAME_DURATION_MS,
        );

        if (framesToAdvance > 0) {
          accumulatedFrameMsRef.current %= SISYPHUS_FRAME_DURATION_MS;
          setFrameIndex(
            (currentFrame) =>
              (currentFrame + framesToAdvance) % SISYPHUS_FOCUS_FRAMES.length,
          );
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [sequenceReady, isPaused, prefersReducedMotion]);

  const visibleFrameIndex = prefersReducedMotion ? 0 : frameIndex;

  return (
    <div
      className="sisyphusFrameStage"
      data-ready={framesReady}
      role="img"
      aria-label="Sisyphus steadily pushing a boulder uphill"
    >
      <Image
        className="sisyphusFrame"
        src={SISYPHUS_FOCUS_FRAMES[visibleFrameIndex]}
        alt=""
        width={768}
        height={768}
        sizes="(max-width: 48rem) 74vw, 19rem"
        loading="eager"
        decoding="sync"
        draggable={false}
        unoptimized
      />
    </div>
  );
}

type FocusScreenProps = {
  quest: Quest;
  user: User;
  onQuit: () => void;
  onFinished: (questId: string, addedMinutes: number) => void;
};

function FocusScreen({ quest, user, onQuit, onFinished }: FocusScreenProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [displayMs, setDisplayMs] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const isFinishingRef = useRef(false);
  const wasRunningBeforeQuitRef = useRef(false);
  const pauseButtonRef = useRef<HTMLButtonElement>(null);

  const getElapsedMs = useCallback(() => {
    if (isPausedRef.current) {
      return accumulatedMsRef.current;
    }
    const start = segmentStartRef.current;
    if (start === null) {
      return accumulatedMsRef.current;
    }
    return accumulatedMsRef.current + Math.max(0, Date.now() - start);
  }, []);

  // Initialize start timestamp, lock body scroll, and move focus on entry
  useEffect(() => {
    segmentStartRef.current = Date.now();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Auto-focus primary control
    const timer = setTimeout(() => {
      pauseButtonRef.current?.focus();
    }, 40);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Timer ticker and visibility/focus handlers to prevent background drift
  useEffect(() => {
    const updateDisplay = () => {
      setDisplayMs(getElapsedMs());
    };

    const intervalId = setInterval(updateDisplay, 200);

    const handleSync = () => {
      updateDisplay();
    };

    document.addEventListener("visibilitychange", handleSync);
    window.addEventListener("focus", handleSync);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, [getElapsedMs]);

  const handleTogglePause = useCallback(() => {
    if (isFinishingRef.current) return;

    if (isPausedRef.current) {
      // Resume
      segmentStartRef.current = Date.now();
      isPausedRef.current = false;
      setIsPaused(false);
      setDisplayMs(accumulatedMsRef.current);
    } else {
      // Pause
      const now = Date.now();
      const start = segmentStartRef.current ?? now;
      const elapsedSegment = Math.max(0, now - start);
      accumulatedMsRef.current += elapsedSegment;
      segmentStartRef.current = null;
      isPausedRef.current = true;
      setIsPaused(true);
      setDisplayMs(accumulatedMsRef.current);
    }
  }, []);

  const handleQuitClick = useCallback(() => {
    if (isFinishingRef.current) return;

    const elapsed = getElapsedMs();
    if (elapsed < 1000) {
      // Immediate exit if no time has elapsed
      onQuit();
      return;
    }

    // Freeze motion/timer while quit confirmation is open
    if (!isPausedRef.current) {
      wasRunningBeforeQuitRef.current = true;
      handleTogglePause();
    } else {
      wasRunningBeforeQuitRef.current = false;
    }

    setShowQuitConfirm(true);
  }, [getElapsedMs, handleTogglePause, onQuit]);

  const confirmQuit = () => {
    setShowQuitConfirm(false);
    onQuit();
  };

  const cancelQuit = useCallback(() => {
    setShowQuitConfirm(false);
    if (wasRunningBeforeQuitRef.current && isPausedRef.current) {
      handleTogglePause();
    }
  }, [handleTogglePause]);

  const handleFinish = async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    setIsFinishing(true);
    setFinishError(null);

    // Freeze timer locally
    const finalElapsedMs = getElapsedMs();
    if (!isPausedRef.current) {
      accumulatedMsRef.current = finalElapsedMs;
      isPausedRef.current = true;
      setIsPaused(true);
      setDisplayMs(finalElapsedMs);
    }

    const elapsedSeconds = Math.floor(finalElapsedMs / 1000);
    // Conscious product policy: full completed minutes only
    const addedMinutes = Math.floor(elapsedSeconds / 60);

    try {
      const database = getFirebaseDb();
      const questRef = doc(database, "users", user.uid, "quests", quest.id);

      await runTransaction(database, async (transaction) => {
        const questDoc = await transaction.get(questRef);
        if (!questDoc.exists()) {
          throw new Error("Quest no longer exists.");
        }
        const data = questDoc.data();
        const currentFocus = typeof data.focusMinutes === "number" ? Math.floor(data.focusMinutes) : 0;
        const newFocusMinutes = currentFocus + addedMinutes;

        transaction.update(questRef, {
          completed: true,
          focusMinutes: newFocusMinutes,
        });
      });

      onFinished(quest.id, addedMinutes);
    } catch (err) {
      // Retain the focus screen on failure so progress is not lost, and allow retry
      isFinishingRef.current = false;
      setIsFinishing(false);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Could not save focus session. Please check your connection and retry.";
      setFinishError(message);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showQuitConfirm) {
        if (event.key === "Escape") {
          event.preventDefault();
          cancelQuit();
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        handleQuitClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showQuitConfirm, handleQuitClick, cancelQuit]);

  const minutesFocused = Math.floor(displayMs / 60000);

  return (
    <section
      className="focusScreen"
      data-paused={isPaused}
      aria-label={`Focus mode for ${quest.title}`}
    >
      <div className="focusContainer">
        <header className="focusHeader">
          <span className="focusCategoryPill">{quest.category}</span>
          <h1 className="focusQuestTitle">{quest.title}</h1>
          {quest.description ? <p className="focusQuestDesc">{quest.description}</p> : null}
        </header>

        <div className="focusVisualSection">
          <div className="sisyphusAnimationWrapper">
            <SisyphusFrameAnimation isPaused={isPaused} />
          </div>

          <div
            className="focusTimerBox"
            role="timer"
            aria-live="off"
            aria-label={`Elapsed focus time: ${minutesFocused} minutes ${Math.floor((displayMs % 60000) / 1000)} seconds`}
          >
            <div className="focusTimerNumerals" aria-hidden="true">
              {formatTimerDigits(displayMs)}
            </div>
            <div className="focusStatusBadge">
              <span className="focusStatusDot" aria-hidden="true" />
              <span>{isPaused ? "Paused" : "Focusing"}</span>
            </div>
          </div>
        </div>

        <div className="focusControls">
          {finishError ? (
            <div className="focusErrorBanner" role="alert">
              <span>{finishError}</span>
              <button
                type="button"
                className="focusErrorRetryButton"
                onClick={handleFinish}
                disabled={isFinishing}
              >
                Retry
              </button>
            </div>
          ) : null}

          <div className="focusPrimaryRow">
            <button
              ref={pauseButtonRef}
              type="button"
              className="focusPauseButton"
              onClick={handleTogglePause}
              disabled={isFinishing}
              aria-label={isPaused ? "Resume focus timer" : "Pause focus timer"}
            >
              {isPaused ? (
                <>
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  <span>Pause</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="focusFinishButton"
              onClick={handleFinish}
              disabled={isFinishing}
              aria-label="Finished focus session. Save progress and mark quest completed"
            >
              {isFinishing ? (
                <span>Saving…</span>
              ) : (
                <>
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span>Finished</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            className="focusQuitButton"
            onClick={handleQuitClick}
            disabled={isFinishing}
            aria-label="Quit focus session without saving"
          >
            Quit session
          </button>
        </div>
      </div>

      {showQuitConfirm ? (
        <div
          className="focusModalScrim"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quit-dialog-title"
          aria-describedby="quit-dialog-desc"
        >
          <div className="focusModalCard">
            <h2 id="quit-dialog-title">Discard session?</h2>
            <p id="quit-dialog-desc">
              {minutesFocused > 0
                ? `${minutesFocused} minute${minutesFocused === 1 ? "" : "s"} of focus will not be saved.`
                : "Your elapsed focus time will not be saved."}
            </p>
            <div className="focusModalActions">
              <button
                type="button"
                className="quitConfirmButton"
                onClick={confirmQuit}
                autoFocus
              >
                Discard and quit
              </button>
              <button
                type="button"
                className="quitCancelButton"
                onClick={cancelQuit}
              >
                Keep focusing
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function QuestApp({ today }: QuestAppProps) {
  const firebaseConfigured = isFirebaseConfigured();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [user, setUser] = useState<User | null | undefined>(firebaseConfigured ? undefined : null);
  const [activeTab, setActiveTab] = useState<"tasks" | "school" | "stats">("tasks");
  const [view, setView] = useState<"all" | "categories">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<QuestForm>(emptyForm);
  const [savingQuestId, setSavingQuestId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saveError, setSaveError] = useState(firebaseConfigured ? "" : "Firebase is not configured yet.");
  const [showHomeScreenHint, setShowHomeScreenHint] = useState(false);
  const [focusQuest, setFocusQuest] = useState<Quest | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  // Hold-and-drag reordering state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragStartIndex, setDragStartIndex] = useState<number>(-1);
  const [targetDropIndex, setTargetDropIndex] = useState<number>(-1);
  const [dragDeltaY, setDragDeltaY] = useState<number>(0);
  const [dragItemHeight, setDragItemHeight] = useState<number>(62);

  const startPointerYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef<boolean>(false);
  const questsRef = useRef(quests);

  useEffect(() => {
    questsRef.current = quests;
  }, [quests]);

  const {
    sheetRef: newSheetRef,
    scrimRef: newSheetScrimRef,
    dragHandleProps: newSheetDragHandleProps,
  } = useSheetSwipe({ onClose: closeSheet });

  function handleFocusFinished(questId: string, addedMinutes: number) {
    setQuests((current) =>
      current.map((item) =>
        item.id === questId
          ? {
              ...item,
              completed: true,
              focusMinutes: item.focusMinutes + addedMinutes,
            }
          : item,
      ),
    );
    setFocusQuest(null);
    setSelectedQuestId(null);
  }

  const openCount = quests.filter((quest) => !quest.completed).length;
  const completedCount = quests.length - openCount;
  const totalXP = quests.reduce((total, quest) => total + quest.focusMinutes, 0);
  const groupedQuests = useMemo(() => {
    const categories = Array.from(new Set(quests.map((quest) => quest.category))).sort();
    return categories.map((category) => ({
      category,
      quests: quests.filter((quest) => quest.category === category),
    }));
  }, [quests]);

  const categories = useMemo(
    () => Array.from(new Set(quests.map((quest) => quest.category))).sort(),
    [quests],
  );

  useEffect(() => {
    if (!firebaseConfigured) {
      return;
    }

    let stopQuestSync: (() => void) | undefined;

    const auth = getFirebaseAuth();
    const database = getFirebaseDb();
    const stopAuthListener = onAuthStateChanged(auth, (nextUser) => {
      stopQuestSync?.();
      setUser(nextUser);

      if (!nextUser) {
        setQuests([]);
        return;
      }

      const questQuery = query(
        collection(database, "users", nextUser.uid, "quests"),
        orderBy("createdAt", "desc"),
      );

      stopQuestSync = onSnapshot(
        questQuery,
        (snapshot) => {
          const fetched = snapshot.docs.map((quest) => {
            const data = quest.data();
            return {
              id: quest.id,
              title: String(data.title ?? ""),
              description: String(data.description ?? ""),
              category: String(data.category ?? "General"),
              dueDate: String(data.dueDate ?? ""),
              completed: Boolean(data.completed),
              focusMinutes: Number(data.focusMinutes ?? 0),
              order: typeof data.order === "number" ? data.order : undefined,
            };
          });

          try {
            const cachedOrderJson = localStorage.getItem(`todo-quest-order-${nextUser.uid}`);
            if (cachedOrderJson) {
              const orderMap = new Map<string, number>(
                (JSON.parse(cachedOrderJson) as string[]).map((id, index) => [id, index]),
              );
              fetched.sort((a, b) => {
                const orderA = a.order ?? orderMap.get(a.id);
                const orderB = b.order ?? orderMap.get(b.id);
                if (typeof orderA === "number" && typeof orderB === "number") {
                  return orderA - orderB;
                }
                if (typeof orderA === "number") return -1;
                if (typeof orderB === "number") return 1;
                return 0;
              });
            } else {
              fetched.sort((a, b) => {
                if (typeof a.order === "number" && typeof b.order === "number") {
                  return a.order - b.order;
                }
                if (typeof a.order === "number") return -1;
                if (typeof a.order === "number") return 1;
                return 0;
              });
            }
          } catch {}

          setQuests(fetched);
        },
        () => setSaveError("Your quests could not be loaded. Try refreshing."),
      );
    });

    return () => {
      stopQuestSync?.();
      stopAuthListener();
    };
  }, [firebaseConfigured]);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;

    if (isIOS && !isStandalone && localStorage.getItem("todo-quest-home-screen-hint-dismissed") !== "true") {
      const animationFrame = requestAnimationFrame(() => setShowHomeScreenHint(true));
      return () => cancelAnimationFrame(animationFrame);
    }
  }, []);

  function dismissHomeScreenHint() {
    localStorage.setItem("todo-quest-home-screen-hint-dismissed", "true");
    setShowHomeScreenHint(false);
  }

  const saveQuestOrder = useCallback(
    async (reorderedQuests: Quest[]) => {
      if (!user) return;

      try {
        localStorage.setItem(
          `todo-quest-order-${user.uid}`,
          JSON.stringify(reorderedQuests.map((q) => q.id)),
        );
      } catch {}

      try {
        const database = getFirebaseDb();
        const batch = writeBatch(database);
        reorderedQuests.forEach((quest, index) => {
          const questRef = doc(database, "users", user.uid, "quests", quest.id);
          batch.update(questRef, { order: index });
        });
        await batch.commit();
      } catch (err) {
        console.warn("Could not persist quest order to Firestore", err);
      }
    },
    [user],
  );

  const startDrag = useCallback((questId: string, clientY: number) => {
    const index = questsRef.current.findIndex((q) => q.id === questId);
    if (index === -1) return;

    const cardEl = document.querySelector(`[data-quest-id="${questId}"]`) as HTMLElement;
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      const parentEl = cardEl.parentElement;
      const rowGap = parentEl ? parseFloat(window.getComputedStyle(parentEl).rowGap || "7") || 7 : 7;
      setDragItemHeight(rect.height + rowGap);
    }

    startPointerYRef.current = clientY;
    isDraggingRef.current = true;
    setDraggedId(questId);
    setDragStartIndex(index);
    setTargetDropIndex(index);
    setDragDeltaY(0);
    suppressClickRef.current = true;

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(18);
    }
    document.body.style.userSelect = "none";
    document.body.style.touchAction = "none";
  }, []);

  const handleCardPointerDown = useCallback(
    (event: React.PointerEvent, questId: string, isHandle?: boolean) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest(".completeButton")) return;

      const clientY = event.clientY;
      const clientX = event.clientX;

      if (isHandle) {
        event.preventDefault();
        startDrag(questId, clientY);
        return;
      }

      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }

      holdTimerRef.current = setTimeout(() => {
        startDrag(questId, clientY);
      }, 200);

      const onCancelCheck = () => {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        window.removeEventListener("pointermove", onCheckMove);
        window.removeEventListener("pointerup", onCancelCheck);
        window.removeEventListener("pointercancel", onCancelCheck);
      };

      const onCheckMove = (moveEvt: PointerEvent) => {
        const dist = Math.hypot(moveEvt.clientX - clientX, moveEvt.clientY - clientY);
        if (dist > 16) {
          onCancelCheck();
        }
      };

      window.addEventListener("pointermove", onCheckMove, { passive: true });
      window.addEventListener("pointerup", onCancelCheck, { once: true });
      window.addEventListener("pointercancel", onCancelCheck, { once: true });
    },
    [startDrag],
  );

  // Global window listeners while dragging
  useEffect(() => {
    if (!draggedId) return;

    const onPointerMove = (e: PointerEvent) => {
      e.preventDefault();

      if (e.clientY < 110) {
        window.scrollBy({ top: -8, behavior: "auto" });
      } else if (e.clientY > window.innerHeight - 110) {
        window.scrollBy({ top: 8, behavior: "auto" });
      }

      const deltaY = e.clientY - startPointerYRef.current;
      setDragDeltaY(deltaY);

      const h = dragItemHeight || 62;
      const slotsMoved = Math.round(deltaY / h);
      const newTarget = Math.max(0, Math.min(questsRef.current.length - 1, dragStartIndex + slotsMoved));

      setTargetDropIndex((prev) => {
        if (prev !== newTarget && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(8);
        }
        return newTarget;
      });
    };

    const onPointerUp = () => {
      if (isDraggingRef.current) {
        const from = dragStartIndex;
        const to = targetDropIndex;

        if (from !== -1 && to !== -1 && from !== to) {
          const next = [...questsRef.current];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          setQuests(next);
          saveQuestOrder(next);
        }

        isDraggingRef.current = false;
        setDraggedId(null);
        setDragStartIndex(-1);
        setTargetDropIndex(-1);
        setDragDeltaY(0);
        document.body.style.userSelect = "";
        document.body.style.touchAction = "";

        setTimeout(() => {
          suppressClickRef.current = false;
        }, 180);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [draggedId, dragStartIndex, targetDropIndex, dragItemHeight, saveQuestOrder]);

  function getCardTransformY(questId: string): number {
    if (!draggedId) return 0;
    if (draggedId === questId) return dragDeltaY;

    const index = quests.findIndex((q) => q.id === questId);
    if (index === -1) return 0;

    const h = dragItemHeight || 62;
    if (dragStartIndex < targetDropIndex) {
      if (index > dragStartIndex && index <= targetDropIndex) {
        return -h;
      }
    } else if (dragStartIndex > targetDropIndex) {
      if (index >= targetDropIndex && index < dragStartIndex) {
        return h;
      }
    }
    return 0;
  }

  async function toggleQuest(id: string) {
    const quest = quests.find((current) => current.id === id);

    if (!quest || !user || savingQuestId !== null) {
      return;
    }

    const completed = !quest.completed;
    setSaveError("");
    setSavingQuestId(id);
    setQuests((current) => current.map((item) => (item.id === id ? { ...item, completed } : item)));

    try {
      await updateDoc(doc(getFirebaseDb(), "users", user.uid, "quests", id), { completed });
    } catch {
      setQuests((current) => current.map((item) => (item.id === id ? quest : item)));
      setSaveError("That change did not save. Try again.");
    } finally {
      setSavingQuestId(null);
    }
  }

  function closeSheet() {
    setSheetOpen(false);
  }

  const handleHomeNavigation = useCallback(() => {
    if (activeTab !== "tasks") {
      setActiveTab("tasks");
    }
    if (sheetOpen) {
      setSheetOpen(false);
    }
    if (view !== "all") {
      setView("all");
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const taskHeading = document.getElementById("quest-heading") ?? document.getElementById("top");
    if (taskHeading) {
      taskHeading.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  }, [activeTab, sheetOpen, view]);

  const handleSchoolNavigation = useCallback(() => {
    if (sheetOpen) {
      setSheetOpen(false);
    }
    setActiveTab("school");
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [sheetOpen]);

  const handleStatsNavigation = useCallback(() => {
    if (sheetOpen) {
      setSheetOpen(false);
    }
    setActiveTab("stats");
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [sheetOpen]);

  async function submitQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const category = form.category.trim();

    if (!title || !category || !user || isCreating) return;

    setSaveError("");
    setIsCreating(true);

    try {
      const minOrder = quests.reduce((min, q) => Math.min(min, q.order ?? 0), 0);
      await addDoc(collection(getFirebaseDb(), "users", user.uid, "quests"), {
        title,
        description: form.description.trim(),
        category,
        dueDate: form.dueDate,
        completed: false,
        focusMinutes: 0,
        order: minOrder - 1,
        createdAt: Date.now(),
      });
      setForm(emptyForm);
      closeSheet();
    } catch {
      setSaveError("That quest did not save. Try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function startSignIn() {
    setSaveError("");

    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    } catch {
      setSaveError("Google sign-in did not start. Try again.");
    }
  }

  async function signOutUser() {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      setSaveError("Could not sign out. Try again.");
    }
  }

  if (user === undefined) {
    return <main className="authShell">Loading your quests…</main>;
  }

  if (!user) {
    return (
      <main className="authShell">
        <section className="authCard" aria-labelledby="sign-in-heading">
          <Image src="/sisyphus.png" alt="Sisyphus carrying a boulder" width={120} height={142} priority unoptimized />
          <p className="heroTitle">Todo Quest</p>
          <h1 id="sign-in-heading">Your quests, wherever you are.</h1>
          <p>Sign in with Google to keep this account&apos;s quests synced across your devices.</p>
          {saveError ? <p className="formError" role="alert">{saveError}</p> : null}
          <button className="signInButton" type="button" onClick={startSignIn}>
            Continue with Google
          </button>
          {showHomeScreenHint ? <HomeScreenHint onDismiss={dismissHomeScreenHint} /> : null}
        </section>
      </main>
    );
  }

  const selectedQuest = selectedQuestId
    ? quests.find((q) => q.id === selectedQuestId) ?? null
    : null;

  const activeFocusQuest = focusQuest
    ? quests.find((q) => q.id === focusQuest.id) ?? focusQuest
    : null;

  return (
    <>
      <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
        <defs>
          <filter id="pencil-stroke">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {activeFocusQuest ? (
        <FocusScreen
          quest={activeFocusQuest}
          user={user}
          onQuit={() => setFocusQuest(null)}
          onFinished={handleFocusFinished}
        />
      ) : (
        <main className="appShell">
      <header className="topBar">
        <a className="brand" href="#top" aria-label="Todo Quest home">
          <Image
            className="brandLogo"
            src="/icon-192.png"
            alt=""
            width={40}
            height={40}
            preload
            unoptimized
          />
        </a>
        <div className="topBarActions">
          {activeTab === "tasks" ? (
            <button
              className="topAddButton"
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label="Create new quest"
              title="New quest"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New quest</span>
            </button>
          ) : null}
          <button className="profileButton" type="button" onClick={signOutUser} title="Sign out" aria-label="Sign out">
            {(user.displayName ?? user.email ?? "U").slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>

      {activeTab === "school" ? (
        <div className="content" id="top">
          <SchoolView userId={user?.uid} />
        </div>
      ) : activeTab === "stats" ? (
        <div className="content" id="top">
          <StatsView key={user?.uid ?? "anon"} userId={user?.uid} quests={quests} />
        </div>
      ) : (
        <div className="content" id="top">
          {showHomeScreenHint ? <HomeScreenHint onDismiss={dismissHomeScreenHint} /> : null}
        <section className="hero" aria-label="Todo Quest">
          <Image
            className="heroLogo"
            src="/sisyphus.png"
            alt="Sisyphus carrying a boulder"
            width={1152}
            height={1366}
            sizes="(max-width: 48rem) 70vw, 18rem"
            preload
            unoptimized
          />
          <p className="heroTitle">Todo Quest</p>
        </section>

        <section className="statStrip" aria-label="Daily progress">
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
          <div>
            <span>Focus XP</span>
            <strong>{totalXP}</strong>
          </div>
          <div>
            <span>Categories</span>
            <strong>{groupedQuests.length}</strong>
          </div>
        </section>

        <section className="questSection" aria-labelledby="quest-heading">
          <div className="sectionHeading">
            <div className="sectionTitleGroup">
              <h2 id="quest-heading">Quests</h2>
              <button
                type="button"
                className="sectionAddButton"
                onClick={() => setSheetOpen(true)}
                aria-label="Create new quest"
                title="New quest"
              >
                <span aria-hidden="true">+</span>
                <span>New</span>
              </button>
            </div>

            <div className="viewSwitch" aria-label="Quest view">
              <button
                type="button"
                className={view === "all" ? "isActive" : ""}
                aria-pressed={view === "all"}
                onClick={() => setView("all")}
              >
                All
              </button>
              <button
                type="button"
                className={view === "categories" ? "isActive" : ""}
                aria-pressed={view === "categories"}
                onClick={() => setView("categories")}
              >
                Categories
              </button>
            </div>
          </div>

          {saveError ? <p className="formError" role="alert">{saveError}</p> : null}

          {view === "all" ? (
            <div className="questList">
              {quests.length === 0 ? (
                <p className="emptyState">Your path is clear. Add the first quest when you are ready.</p>
              ) : (
                quests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    today={today}
                    onToggle={toggleQuest}
                    onSelect={(targetQuest) => {
                      if (suppressClickRef.current) return;
                      setSelectedQuestId(targetQuest.id);
                    }}
                    isUpdating={savingQuestId === quest.id}
                    isDragging={draggedId === quest.id}
                    transformY={getCardTransformY(quest.id)}
                    onPointerDown={handleCardPointerDown}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="categoryList">
              {groupedQuests.map((group) => (
                <section className="categoryGroup" key={group.category}>
                  <div className="categoryHeading">
                    <h3>{group.category}</h3>
                    <span>{group.quests.length}</span>
                  </div>
                  <div className="questList">
                    {group.quests.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        today={today}
                        onToggle={toggleQuest}
                        onSelect={(targetQuest) => {
                          if (suppressClickRef.current) return;
                          setSelectedQuestId(targetQuest.id);
                        }}
                        isUpdating={savingQuestId === quest.id}
                        isDragging={false}
                        transformY={0}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>
      )}


      <div
        className="sheetLayer"
        data-open={sheetOpen}
        aria-hidden={!sheetOpen}
        inert={!sheetOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape") closeSheet();
        }}
      >
        <button
          ref={newSheetScrimRef as React.RefObject<HTMLButtonElement>}
          className="sheetScrim"
          type="button"
          aria-label="Close new quest form"
          onClick={closeSheet}
        />
        <section
          ref={newSheetRef as React.RefObject<HTMLElement>}
          className="sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-title"
        >
          <div className="sheetHandleArea" {...newSheetDragHandleProps}>
            <div className="sheetHandle" aria-hidden="true" />
          </div>
          <div className="sheetHeading" {...newSheetDragHandleProps}>
            <div>
              <h2 id="sheet-title">New quest</h2>
            </div>
            <button className="closeButton" type="button" onClick={closeSheet} aria-label="Close">
              ×
            </button>
          </div>

          <form onSubmit={submitQuest}>
            <label>
              Quest title
              <input
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="What needs to move forward?"
              />
            </label>

            <label>
              Category
              <input
                required
                list="categories"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                placeholder="CIS 25, Work, College…"
              />
              <datalist id="categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>

            <label>
              Description <span>Optional</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="A clear next step or a useful note"
              />
            </label>

            <label>
              Due date <span>Optional</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
              />
            </label>

            <button className="saveButton" type="submit" disabled={isCreating}>
              {isCreating ? "Saving…" : "Create quest"}
            </button>
          </form>
        </section>
      </div>
      {selectedQuest ? (
        <TaskDetailModal
          quest={selectedQuest}
          today={today}
          onClose={() => setSelectedQuestId(null)}
          onToggleComplete={toggleQuest}
          onStartFocus={(targetQuest) => {
            setSelectedQuestId(null);
            setFocusQuest(targetQuest);
          }}
          isUpdating={savingQuestId === selectedQuest.id}
        />
      ) : null}

      <LiquidDock
        activeTab={activeTab}
        onNavigateHome={handleHomeNavigation}
        onNavigateSchool={handleSchoolNavigation}
        onNavigateStats={handleStatsNavigation}
      />
        </main>
      )}
    </>
  );
}
