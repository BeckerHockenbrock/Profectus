"use client";

import { useMemo, useRef, useState } from "react";
import type { FocusScreenProps } from "../types/focus";
import { formatTimerDigits } from "../domain/timer-format";
import { useFocusTimer } from "../hooks/use-focus-timer";
import { SisyphusFrameAnimation } from "./sisyphus-frame-animation";
import { getDailyStoicQuote } from "@/features/quests/data/stoic-quotes";

export function FocusScreen({
  quest,
  targetMinutes,
  initialBlocks,
  onQuit,
  onFinish,
}: FocusScreenProps) {
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const isFinishingRef = useRef(false);

  const quote = useMemo(() => getDailyStoicQuote(), []);

  const {
    isPaused,
    displayMs,
    elapsedMs,
    isGoalReached,
    isCountdown,
    targetMs,
    showQuitConfirm,
    pauseButtonRef,
    handleTogglePause,
    handleQuitClick,
    confirmQuit,
    cancelQuit,
    freezeTimer,
  } = useFocusTimer({ onQuit, isFinishingRef, targetMinutes });

  const handleFinish = async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    setIsFinishing(true);
    setFinishError(null);

    const finalElapsedMs = freezeTimer();
    const elapsedSeconds = Math.floor(finalElapsedMs / 1000);
    // Full completed minutes
    const addedMinutes = Math.floor(elapsedSeconds / 60);
    const blocksCompleted = Math.floor(addedMinutes / 25);

    try {
      await onFinish(addedMinutes, blocksCompleted, quest?.id);
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

  const minutesFocused = Math.floor(elapsedMs / 60000);

  // Progress percentage for countdown
  const progressPercent =
    isCountdown && targetMs && targetMs > 0
      ? Math.min(100, Math.round((elapsedMs / targetMs) * 100))
      : null;

  const headerCategory = quest
    ? quest.category
    : initialBlocks
      ? `${initialBlocks} Block${initialBlocks === 1 ? "" : "s"} · ${targetMinutes}m`
      : targetMinutes
        ? `${targetMinutes}m Sprint`
        : "General Study";

  const headerTitle = quest ? quest.title : "Lock In";
  const headerDescription = quest
    ? quest.description
    : isCountdown
      ? `Pushing the boulder for a ${targetMinutes}-minute focus block`
      : "Open-ended study session";

  return (
    <section
      className="focusScreen"
      data-paused={isPaused}
      aria-label={`Focus mode: ${headerTitle}`}
    >
      <div className="focusContainer">
        <header className="focusHeader">
          <span className="focusCategoryPill">{headerCategory}</span>
          <h1 className="focusQuestTitle">{headerTitle}</h1>
          {headerDescription ? <p className="focusQuestDesc">{headerDescription}</p> : null}
        </header>

        <div className="focusVisualSection">
          <div className="sisyphusAnimationWrapper">
            <SisyphusFrameAnimation isPaused={isPaused} />
          </div>

          <div
            className="focusTimerBox"
            role="timer"
            aria-live="off"
            aria-label={`Focus time: ${minutesFocused} minutes elapsed`}
          >
            {progressPercent !== null ? (
              <div className="focusProgressBarWrapper" aria-hidden="true">
                <div
                  className="focusProgressBarFill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            ) : null}

            <div className="focusTimerNumerals" aria-hidden="true">
              {formatTimerDigits(displayMs)}
            </div>

            <div className="focusStatusBadge">
              <span
                className={`focusStatusDot ${isGoalReached ? "isCompleted" : ""}`}
                aria-hidden="true"
              />
              <span>
                {isGoalReached
                  ? "Summit Reached! 🪨"
                  : isPaused
                    ? "Paused"
                    : isCountdown
                      ? "Focusing"
                      : "Locking In"}
              </span>
            </div>
          </div>

          {/* Stoic Motivation Under Timer */}
          <div className="focusStoicQuote" aria-label="Stoic quote">
            <p className="focusQuoteText">“{quote.text}”</p>
            <span className="focusQuoteAuthor">— {quote.author}</span>
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
              className={`focusFinishButton ${isGoalReached ? "isReadyFinish" : ""}`}
              onClick={handleFinish}
              disabled={isFinishing}
              aria-label="Finished focus session. Save progress"
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
