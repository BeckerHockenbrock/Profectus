"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SISYPHUS_FOCUS_FRAMES = Array.from(
  { length: 12 },
  (_, index) => `/focus/sisyphus/frame-${String(index + 1).padStart(2, "0")}.png`,
);
const SISYPHUS_FRAME_DURATION_MS = 120;

export function SisyphusFrameAnimation({ isPaused }: { isPaused: boolean }) {
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
