"use client";

import { useRef, useState } from "react";
import type { FocusScreenProps } from "../types/focus";
import { formatTimerDigits } from "../domain/timer-format";
import { useFocusTimer } from "../hooks/use-focus-timer";
import { SisyphusFrameAnimation } from "./sisyphus-frame-animation";

export function FocusScreen({ quest, onQuit, onFinish }: FocusScreenProps) {
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const isFinishingRef = useRef(false);

  const {
    isPaused,
    displayMs,
    showQuitConfirm,
    pauseButtonRef,
    handleTogglePause,
    handleQuitClick,
    confirmQuit,
    cancelQuit,
    freezeTimer,
  } = useFocusTimer({ onQuit, isFinishingRef });

  const handleFinish = async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    setIsFinishing(true);
    setFinishError(null);

    const finalElapsedMs = freezeTimer();
    const elapsedSeconds = Math.floor(finalElapsedMs / 1000);
    // Conscious product policy: full completed minutes only
    const addedMinutes = Math.floor(elapsedSeconds / 60);

    try {
      await onFinish(quest.id, addedMinutes);
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
