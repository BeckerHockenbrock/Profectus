"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatTimerDigits } from "../domain/timer-format";

const STORAGE_KEY = "todo_quest_live_lockscreen_enabled";

type UseMediaSessionOptions = {
  isPaused: boolean;
  isGoalReached: boolean;
  isCountdown: boolean;
  displayMs: number;
  elapsedMs: number;
  targetMs: number | null;
  title?: string;
  onTogglePause: () => void;
};

export function useMediaSession({
  isPaused,
  isGoalReached,
  isCountdown,
  displayMs,
  elapsedMs,
  targetMs,
  title,
  onTogglePause,
}: UseMediaSessionOptions) {
  // User preference: default to true, persisted in localStorage
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onTogglePauseRef = useRef(onTogglePause);
  const isPausedRef = useRef(isPaused);
  const isGoalReachedRef = useRef(isGoalReached);

  useEffect(() => {
    onTogglePauseRef.current = onTogglePause;
    isPausedRef.current = isPaused;
    isGoalReachedRef.current = isGoalReached;
  });

  // Initialize audio element once
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio("/silent.wav");
    audio.loop = true;
    audio.setAttribute("playsinline", "true");
    audio.volume = 0.05; // Non-zero volume so mobile WebKit recognizes active media
    audioRef.current = audio;

    const handlePlaying = () => {
      setIsAudioPlaying(true);
      setNeedsGesture(false);
    };
    const handlePause = () => {
      setIsAudioPlaying(false);
    };

    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Sync audio playback with timer state and enabled preference
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isEnabled || isPaused || isGoalReached) {
      if (!audio.paused) {
        audio.pause();
      }
      return;
    }

    // Should be playing silent track to keep MediaSession alive
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsAudioPlaying(true);
          setNeedsGesture(false);
        })
        .catch((err) => {
          // Autoplay blocked by browser policy: requires direct user tap
          setIsAudioPlaying(false);
          setNeedsGesture(true);
          console.debug("Lock screen audio waiting for user gesture:", err);
        });
    }
  }, [isEnabled, isPaused, isGoalReached]);

  // Activate audio directly on user gesture (e.g. clicking the live toggle pill)
  const activateAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPausedRef.current || isGoalReachedRef.current) {
        await audio.play();
        audio.pause();
        setNeedsGesture(false);
      } else {
        await audio.play();
        setIsAudioPlaying(true);
        setNeedsGesture(false);
      }
    } catch (err) {
      console.warn("Could not activate lock screen audio:", err);
    }
  }, []);

  const toggleEnabled = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      if (next) {
        setTimeout(() => {
          activateAudio();
        }, 0);
      } else {
        audioRef.current?.pause();
      }
      return next;
    });
  }, [activateAudio]);

  // Update MediaSession metadata and playbackState
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const formatted = formatTimerDigits(displayMs);
    const sessionLabel = title || "Lock In";
    const statusLabel = isGoalReached
      ? "Complete"
      : isPaused
        ? "Paused"
        : isCountdown
          ? "Remaining"
          : "Elapsed";

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${formatted} ${statusLabel}`,
        artist: sessionLabel,
        album: "Todo Quest · Lock In",
        artwork: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });

      navigator.mediaSession.playbackState = isPaused || !isAudioPlaying ? "paused" : "playing";

      // Set position state for lock screen scrubber bar
      if (
        "setPositionState" in navigator.mediaSession &&
        targetMs &&
        targetMs > 0 &&
        !isGoalReached
      ) {
        const duration = Math.max(1, targetMs / 1000);
        const position = Math.min(duration, Math.max(0, elapsedMs / 1000));
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: isPaused ? 1 : 1,
          position,
        });
      }
    } catch (err) {
      console.debug("MediaSession update error:", err);
    }
  }, [displayMs, elapsedMs, targetMs, isPaused, isGoalReached, isCountdown, title, isAudioPlaying]);

  // Wire bidirectional MediaSession action handlers (Lock Screen / Earbud Play & Pause)
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const handleMediaPlay = async () => {
      if (isPausedRef.current) {
        onTogglePauseRef.current();
      }
      try {
        await audioRef.current?.play();
      } catch {}
    };

    const handleMediaPause = () => {
      if (!isPausedRef.current) {
        onTogglePauseRef.current();
      }
      audioRef.current?.pause();
    };

    try {
      navigator.mediaSession.setActionHandler("play", handleMediaPlay);
      navigator.mediaSession.setActionHandler("pause", handleMediaPause);
      navigator.mediaSession.setActionHandler("stop", handleMediaPause);
    } catch {}

    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
      } catch {}
    };
  }, []);

  return {
    isEnabled,
    isAudioPlaying,
    needsGesture,
    activateAudio,
    toggleEnabled,
  };
}
