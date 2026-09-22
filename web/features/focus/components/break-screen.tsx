"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatTimerDigits } from "../domain/timer-format";

type BreakScreenProps = {
  durationMinutes: number;
  onFinish: () => void;
  onSkip: () => void;
};

const REST_QUOTES = [
  {
    text: "The mind must be given relaxation; it will rise improved and sharper after a good rest.",
    author: "Seneca",
  },
  {
    text: "What is without periods of rest will not endure.",
    author: "Ovid",
  },
  {
    text: "He who has peace for an hour has a fortress.",
    author: "Marcus Aurelius",
  },
  {
    text: "Even Sisyphus pauses at the foot of the mountain to catch his breath before the next climb.",
    author: "Stoic Reflection",
  },
];

export function BreakScreen({ durationMinutes, onFinish, onSkip }: BreakScreenProps) {
  const targetMs = durationMinutes * 60 * 1000;
  const [isPaused, setIsPaused] = useState(false);
  const [displayMs, setDisplayMs] = useState(targetMs);
  const [isDone, setIsDone] = useState(false);

  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);

  const quote = REST_QUOTES[Math.abs(durationMinutes) % REST_QUOTES.length];

  useEffect(() => {
    segmentStartRef.current = Date.now();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const updateDisplay = () => {
      let elapsed = accumulatedMsRef.current;
      if (!isPausedRef.current && segmentStartRef.current !== null) {
        elapsed += Math.max(0, Date.now() - segmentStartRef.current);
      }

      const remaining = Math.max(0, targetMs - elapsed);
      setDisplayMs(remaining);

      if (remaining <= 0 && !isDone) {
        setIsDone(true);
      }
    };

    const intervalId = setInterval(updateDisplay, 200);
    return () => clearInterval(intervalId);
  }, [targetMs, isDone]);

  const handleTogglePause = () => {
    if (isPausedRef.current) {
      // Resume
      segmentStartRef.current = Date.now();
      isPausedRef.current = false;
      setIsPaused(false);
    } else {
      // Pause
      const now = Date.now();
      const start = segmentStartRef.current ?? now;
      accumulatedMsRef.current += Math.max(0, now - start);
      segmentStartRef.current = null;
      isPausedRef.current = true;
      setIsPaused(true);
    }
  };

  const progressPercent = Math.min(
    100,
    Math.round(((targetMs - displayMs) / targetMs) * 100),
  );

  return (
    <section className="breakScreen" data-paused={isPaused} aria-label="Rest & Recovery Break">
      <div className="breakContainer">
        <header className="breakHeader">
          <span className="breakCategoryPill">REST & RECOVERY</span>
          <h1 className="breakTitle">{isDone ? "Break Complete" : "Take a Breather."}</h1>
          <p className="breakDesc">
            {isDone
              ? "Your mind is restored. Ready to push the boulder again?"
              : "Step away, stretch your neck, hydrate, and rest your eyes."}
          </p>
        </header>

        <div className="breakVisualSection">
          <div className="breakIconCircle" aria-hidden="true">
            <span className="breakHeroIcon">☕</span>
          </div>

          <div
            className="breakTimerBox"
            role="timer"
            aria-live="off"
            aria-label={`Remaining break time: ${Math.ceil(displayMs / 60000)} minutes`}
          >
            <div className="breakProgressBarWrapper" aria-hidden="true">
              <div
                className="breakProgressBarFill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="breakTimerNumerals" aria-hidden="true">
              {formatTimerDigits(displayMs)}
            </div>

            <div className="breakStatusBadge">
              <span
                className={`breakStatusDot ${isDone ? "isCompleted" : ""}`}
                aria-hidden="true"
              />
              <span>{isDone ? "Refreshed" : isPaused ? "Paused" : "Resting"}</span>
            </div>
          </div>

          <div className="breakStoicQuote">
            <p className="breakQuoteText">“{quote.text}”</p>
            <span className="breakQuoteAuthor">— {quote.author}</span>
          </div>
        </div>

        <div className="breakControls">
          {isDone ? (
            <button
              type="button"
              className="breakPrimaryButton"
              onClick={onFinish}
            >
              Lock In Again 🔥
            </button>
          ) : (
            <div className="breakPrimaryRow">
              <button
                type="button"
                className="breakPauseButton"
                onClick={handleTogglePause}
              >
                {isPaused ? "Resume Break" : "Pause"}
              </button>

              <button
                type="button"
                className="breakFinishEarlyButton"
                onClick={onFinish}
              >
                End Break Early
              </button>
            </div>
          )}

          <button
            type="button"
            className="breakSkipButton"
            onClick={onSkip}
          >
            Dismiss to Home
          </button>
        </div>
      </div>
    </section>
  );
}
