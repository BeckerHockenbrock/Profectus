"use client";

import { useCallback, useState } from "react";
import { getDailyStoicQuote, getNextStoicQuote, type StoicQuote as StoicQuoteType } from "../data/stoic-quotes";

type StoicQuoteProps = {
  today?: string;
  className?: string;
};

export function StoicQuote({ today, className = "" }: StoicQuoteProps) {
  const [userSelectedQuote, setUserSelectedQuote] = useState<StoicQuoteType | null>(null);
  const [prevToday, setPrevToday] = useState(today);

  if (prevToday !== today) {
    setPrevToday(today);
    setUserSelectedQuote(null);
  }

  const quote = userSelectedQuote ?? getDailyStoicQuote(today);

  const handleNextQuote = useCallback(() => {
    setUserSelectedQuote((prev) => getNextStoicQuote(prev?.id ?? quote.id));
  }, [quote.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNextQuote();
    }
  };

  return (
    <figure
      className={`heroQuote ${className}`.trim()}
      onClick={handleNextQuote}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      title="Click for another stoic quote"
      aria-label={`Stoic quote by ${quote.author}. Click to shuffle.`}
    >
      <blockquote className="heroQuoteText">“{quote.text}”</blockquote>
      <figcaption className="heroQuoteAuthor">— {quote.author}</figcaption>
    </figure>
  );
}
