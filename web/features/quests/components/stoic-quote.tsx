"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createShuffledDeck,
  type StoicQuote as StoicQuoteType,
} from "../data/stoic-quotes";

type StoicQuoteProps = {
  today?: string;
  className?: string;
  intervalMs?: number;
};

export function StoicQuote({
  className = "",
  intervalMs = 24000,
}: StoicQuoteProps) {
  // Initialize randomized shuffled deck and random starting index
  const [state, setState] = useState<{
    deck: StoicQuoteType[];
    index: number;
  }>(() => {
    const initialDeck = createShuffledDeck();
    const initialIndex = Math.floor(Math.random() * initialDeck.length);
    return { deck: initialDeck, index: initialIndex };
  });

  const [isFading, setIsFading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuote = state.deck[state.index] ?? state.deck[0];

  const advanceQuote = useCallback(() => {
    setIsFading(true);
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
    fadeTimeoutRef.current = setTimeout(() => {
      setState((prev) => {
        const nextIndex = prev.index + 1;
        if (nextIndex >= prev.deck.length) {
          // Deck exhausted, create a fresh shuffle without repeating the boundary quote
          const lastId = prev.deck[prev.deck.length - 1]?.id;
          const nextDeck = createShuffledDeck(lastId);
          return { deck: nextDeck, index: 0 };
        }
        return { deck: prev.deck, index: nextIndex };
      });
      setIsFading(false);
    }, 240);
  }, []);

  const handleClick = useCallback(() => {
    if (isFading) {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      setState((prev) => {
        const nextIndex = (prev.index + 1) % prev.deck.length;
        return { deck: prev.deck, index: nextIndex };
      });
      setIsFading(false);
      return;
    }
    advanceQuote();
  }, [advanceQuote, isFading]);

  // Pause when the tab is hidden so users don't miss quotes while away
  useEffect(() => {
    const handleVisibility = () => {
      setIsDocumentHidden(document.visibilityState === "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Periodic automatic rotation (resets timer whenever index changes)
  useEffect(() => {
    if (isHovered || isFocused || isDocumentHidden) {
      return;
    }

    const timer = setInterval(() => {
      advanceQuote();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [advanceQuote, intervalMs, isHovered, isFocused, isDocumentHidden, state.index]);

  // Clean up pending animation timeout on unmount
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <figure
      className={`heroQuote ${className}`.trim()}
      data-fading={isFading}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      title="Click for another stoic quote"
      aria-label={`Stoic quote by ${currentQuote.author}. Click to shuffle.`}
      suppressHydrationWarning
    >
      <blockquote className="heroQuoteText" suppressHydrationWarning>
        “{currentQuote.text}”
      </blockquote>
      <figcaption className="heroQuoteAuthor" suppressHydrationWarning>
        — {currentQuote.author}
      </figcaption>
    </figure>
  );
}
