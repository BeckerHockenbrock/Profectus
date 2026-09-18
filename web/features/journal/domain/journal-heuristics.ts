import type { LifeAttribute } from "@/features/stats/types/stats";
import { LIFE_ATTRIBUTES } from "@/features/stats/types/stats";
import type { JournalStatEvaluation } from "../types/journal";

/**
 * Strict heuristic analysis used when offline or before a Gemini API key is configured.
 * Evaluates performance on a demanding 0-100% scale specifically for the chosen stat.
 */
export function analyzeJournalHeuristically(content: string, stat: LifeAttribute): JournalStatEvaluation {
  const lower = content.toLowerCase();
  const wordCount = content.trim().split(/\s+/).length;

  let baseScore = 40; // baseline for minimal attempt

  // Keyword relevance to the specific stat
  const meta = LIFE_ATTRIBUTES[stat];
  let keywordMatches = 0;
  for (const kw of meta.keywords) {
    if (lower.includes(kw.toLowerCase())) {
      keywordMatches++;
    }
  }

  // Stat-specific rigorous metric detection
  let metricBonus = 0;
  if (stat === "exercise") {
    if (/(\d+)\s*(miles|km|min|minutes|reps|sets|lbs|kg)/i.test(lower)) metricBonus += 15;
    if (/intense|heavy|pr|exhausted|pushed|sweat|circuit|hard/i.test(lower)) metricBonus += 10;
    if (lower.includes("gym") || lower.includes("workout") || lower.includes("cardio")) metricBonus += 8;
  } else if (stat === "intellect") {
    if (/(\d+)\s*(hours|hrs|pages|chapters|problems)/i.test(lower)) metricBonus += 15;
    if (/deep work|focus|flow|absorbed|complex|hard problem|solved/i.test(lower)) metricBonus += 10;
    if (lower.includes("study") || lower.includes("code") || lower.includes("exam")) metricBonus += 8;
  } else if (stat === "discipline") {
    if (/routine|no excuses|early|cold|streak|temptation|delayed/i.test(lower)) metricBonus += 15;
    if (/morning|chores|clean|organized|plan|habit/i.test(lower)) metricBonus += 10;
    if (/distraction|procrastinat/i.test(lower)) metricBonus -= 8;
  } else if (stat === "sleep") {
    const matchHours = lower.match(/(\d+(?:\.\d+)?)\s*(hours|hrs)/i);
    if (matchHours) {
      const hours = parseFloat(matchHours[1]);
      if (hours >= 7 && hours <= 9) metricBonus += 22; // optimal range
      else if (hours >= 6) metricBonus += 10;
      else metricBonus -= 10;
    }
    if (/consistent bedtime|dark room|deep sleep|rested|no screen/i.test(lower)) metricBonus += 10;
  } else if (stat === "love") {
    if (/deep conversation|vulnerable|heartfelt|sacrificed|self-compassion/i.test(lower)) metricBonus += 15;
    if (/grateful|gratitude|appreciated|cherish|family/i.test(lower)) metricBonus += 10;
  } else if (stat === "social") {
    if (/meaningful|connection|listened|helped|reconnected|dinner/i.test(lower)) metricBonus += 15;
    if (/friend|hangout|called|team|community/i.test(lower)) metricBonus += 10;
  }

  // Length and substance bonus (capped)
  const substanceBonus = Math.min(10, Math.floor(wordCount / 12));

  // Compute raw score (Strict grading: 50-70 is normal, 80+ requires high substance and metrics)
  let rawScore = baseScore + Math.min(15, keywordMatches * 5) + metricBonus + substanceBonus;

  // Clamp strictly between 15% and 88% (heuristic cannot grant 90%+ without AI verification)
  const score = Math.max(15, Math.min(88, Math.round(rawScore)));

  // XP is earned from the score
  const xpEarned = Math.max(15, Math.round(score * 0.5 + 10));

  let keyTakeaway = `${meta.name} Check-in`;
  if (score >= 80) keyTakeaway = `High Standard ${meta.name}`;
  else if (score >= 65) keyTakeaway = `Consistent ${meta.name}`;
  else keyTakeaway = `Foundational ${meta.name}`;

  let feedback = "";
  if (score >= 80) {
    feedback = `Demanding execution on ${meta.name}. You pushed past resistance and held yourself to a high standard.`;
  } else if (score >= 65) {
    feedback = `Solid, steady effort on ${meta.name}. Consistency is building, now look for areas to increase intensity or depth.`;
  } else {
    feedback = `A baseline start for ${meta.name}. To push your average into the 70s and 80s, eliminate shortcuts and add measurable rigor tomorrow.`;
  }

  return {
    stat,
    score,
    xpEarned,
    feedback,
    keyTakeaway,
    sentiment: score >= 70 ? "positive" : "reflective",
  };
}
