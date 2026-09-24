"use client";

import { useRef, useState } from "react";
import type { BreakAction, FocusScreenProps } from "../types/focus";
import { formatTimerDigits } from "../domain/timer-format";
import { useFocusTimer } from "../hooks/use-focus-timer";

export function FocusScreen({
  quest,
  targetMinutes,
  initialBlocks,
  onQuit,
  onFinish,
}: FocusScreenProps) {
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{
    addedMinutes: number;
    blocksCompleted: number;
    earnedBreakMinutes: number;
  } | null>(null);

  const isFinishingRef = useRef(false);

  const headerTitle = quest ? quest.title : "Lock In";

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
    mediaSession,
  } = useFocusTimer({
    onQuit,
    isFinishingRef,
    targetMinutes,
    title: headerTitle,
  });

  const handleFinishClick = () => {
    if (isFinishingRef.current) return;
    const finalElapsedMs = freezeTimer();
    const elapsedSeconds = Math.floor(finalElapsedMs / 1000);
    const addedMinutes = Math.floor(elapsedSeconds / 60);

    const calculatedBlocks = initialBlocks
      ? initialBlocks
      : Math.max(1, Math.floor(addedMinutes / 5));
    const earnedBreakMinutes = calculatedBlocks * 5;

    if (addedMinutes >= 1) {
      setSessionSummary({
        addedMinutes,
        blocksCompleted: calculatedBlocks,
        earnedBreakMinutes,
      });
      setShowBreakModal(true);
    } else {
      executeFinish(addedMinutes, calculatedBlocks, undefined);
    }
  };

  const executeFinish = async (
    addedMinutes: number,
    blocksCompleted: number,
    breakAction?: BreakAction,
  ) => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    setIsFinishing(true);
    setFinishError(null);

    try {
      await onFinish(addedMinutes, blocksCompleted, quest?.id, breakAction);
    } catch (err) {
      isFinishingRef.current = false;
      setIsFinishing(false);
      setShowBreakModal(false);
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

  const timerLabel = isCountdown ? "remaining" : "elapsed";
  const ringCircumference = 2 * Math.PI * 108;
  const ringProgress = progressPercent ?? 0;
  const isLiveActive = mediaSession.isEnabled && (mediaSession.isAudioPlaying || !isPaused);

  return (
    <section
      className="focusScreen"
      data-paused={isPaused}
      aria-label={`Focus mode: ${headerTitle}`}
    >
      <div className="focusContainer">
        <header className="focusHeader">
          <h1 className="focusQuestTitle">{headerTitle}</h1>
          <button
            type="button"
            className={`focusLivePill ${isLiveActive ? "isActive" : ""} ${mediaSession.needsGesture ? "needsGesture" : ""}`}
            onClick={mediaSession.needsGesture ? mediaSession.activateAudio : mediaSession.toggleEnabled}
            aria-label={
              mediaSession.needsGesture
                ? "Tap to enable Lock Screen live widget"
                : isLiveActive
                  ? "Lock Screen live widget active. Tap to turn off."
                  : "Lock Screen live widget off. Tap to turn on."
            }
            title={
              mediaSession.needsGesture
                ? "Tap to activate Lock Screen & Dynamic Island Live widget"
                : isLiveActive
                  ? "Live on Lock Screen & Dynamic Island (Tap to turn off)"
                  : "Tap to turn on Lock Screen & Dynamic Island Live widget"
            }
          >
            <span className="livePillDot" aria-hidden="true" />
            <span>
              {mediaSession.needsGesture
                ? "Tap for Lock Screen"
                : isLiveActive
                  ? "Lock Screen Live"
                  : "Lock Screen Off"}
            </span>
          </button>
        </header>

        <div className="focusVisualSection">
          <div
            className="focusTimerBox"
            role="timer"
            aria-live="off"
            aria-label={`Focus time: ${formatTimerDigits(displayMs)} ${timerLabel}`}
          >
            <svg
              className="focusProgressRing"
              viewBox="0 0 240 240"
              aria-hidden="true"
              focusable="false"
            >
              <circle className="focusProgressRingTrack" cx="120" cy="120" r="108" />
              <circle
                className="focusProgressRingFill"
                cx="120"
                cy="120"
                r="108"
                transform="rotate(-90 120 120)"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference * (1 - ringProgress / 100)}
              />
            </svg>
            <div className="focusTimerContent">
              <span className="focusTimerNumerals" aria-hidden="true">
                {formatTimerDigits(displayMs)}
              </span>
              <span className="focusStatusBadge">
                {isGoalReached ? "Complete" : isPaused ? "Paused" : isCountdown ? "Focusing" : "Elapsed"}
              </span>
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
                onClick={handleFinishClick}
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
              onClick={handleFinishClick}
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

      {/* Break Option Modal: Take Break Now or Delay & Stack */}
      {showBreakModal && sessionSummary ? (
        <div
          className="focusModalScrim"
          role="dialog"
          aria-modal="true"
          aria-labelledby="break-modal-title"
        >
          <div className="focusModalCard breakModalCard">
            <div className="breakModalBadge" aria-hidden="true">
              <span>☕</span>
            </div>
            <h2 id="break-modal-title">Block Conquered!</h2>
            <p className="breakModalStats">
              You focused for <strong>{sessionSummary.addedMinutes} minutes</strong> across{" "}
              <strong>{sessionSummary.blocksCompleted} {sessionSummary.blocksCompleted === 1 ? "block" : "blocks"}</strong>.
            </p>
            <p className="breakModalPrompt">
              You earned a <strong>{sessionSummary.earnedBreakMinutes}-minute break</strong> (5m per block).
              Take it now or delay and stack it in your Break Bank.
            </p>

            <div className="breakModalActions">
              <button
                type="button"
                className="takeBreakNowBtn"
                onClick={() =>
                  executeFinish(sessionSummary.addedMinutes, sessionSummary.blocksCompleted, {
                    type: "take_now",
                    breakMinutes: sessionSummary.earnedBreakMinutes,
                  })
                }
                disabled={isFinishing}
              >
                ☕ Take {sessionSummary.earnedBreakMinutes}m Break Now
              </button>

              <button
                type="button"
                className="delayBreakBtn"
                onClick={() =>
                  executeFinish(sessionSummary.addedMinutes, sessionSummary.blocksCompleted, {
                    type: "delay",
                    breakMinutes: sessionSummary.earnedBreakMinutes,
                  })
                }
                disabled={isFinishing}
              >
                ⏳ Delay & Stack Break (+{sessionSummary.earnedBreakMinutes}m)
              </button>

              <button
                type="button"
                className="skipBreakBtn"
                onClick={() =>
                  executeFinish(sessionSummary.addedMinutes, sessionSummary.blocksCompleted, undefined)
                }
                disabled={isFinishing}
              >
                Skip break
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
