import type { LifeAttribute } from "@/features/stats/types/stats";
import { LIFE_ATTRIBUTES } from "@/features/stats/types/stats";
import type { JournalAnalysis, JournalStatGains } from "../types/journal";

/**
 * Fallback heuristic analysis used when offline or before a Gemini API key is configured.
 * Scans user reflection text for relevant keywords across the 6 stats and calculates
 * balanced XP and stat gains.
 */
export function analyzeJournalHeuristically(content: string): JournalAnalysis {
  const lower = content.toLowerCase();

  const baseGains: JournalStatGains = {
    discipline: 0,
    intellect: 0,
    love: 0,
    social: 0,
    exercise: 0,
    sleep: 0,
  };

  const attributes: LifeAttribute[] = ["discipline", "intellect", "love", "social", "exercise", "sleep"];

  // Analyze keyword density and matches
  for (const attr of attributes) {
    const meta = LIFE_ATTRIBUTES[attr];
    let matches = 0;

    for (const kw of meta.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        matches++;
      }
    }

    // Additional targeted regex heuristics
    if (attr === "exercise" && /workout|gym|ran|run|lift|miles|cardio|pushups|sets|training|steps/i.test(lower)) {
      matches += 2;
    }
    if (attr === "sleep" && /sleep|slept|hours of sleep|bedtime|nap|rested|woke up/i.test(lower)) {
      matches += 2;
    }
    if (attr === "intellect" && /studied|study|exam|homework|read|learning|coding|solved|math|class/i.test(lower)) {
      matches += 2;
    }
    if (attr === "discipline" && /routine|habit|focused|morning|consistency|streak|chores|clean|plan/i.test(lower)) {
      matches += 2;
    }
    if (attr === "love" && /grateful|gratitude|love|partner|family|appreciate|caring|heart|dating/i.test(lower)) {
      matches += 2;
    }
    if (attr === "social" && /friend|friends|dinner|talked|hung out|called|catch up|met up|people/i.test(lower)) {
      matches += 2;
    }

    if (matches > 0) {
      // Scale points based on matches, capped at 15 points per stat per entry
      baseGains[attr] = Math.min(15, Math.max(3, matches * 3));
    }
  }

  // If no specific keywords matched, award baseline consistency points to discipline
  const totalPoints = Object.values(baseGains).reduce((sum, v) => sum + v, 0);
  if (totalPoints === 0) {
    baseGains.discipline = 5;
  }

  // Calculate total XP (points * 5, plus a baseline 20 XP for journaling)
  const totalEarnedPoints = Object.values(baseGains).reduce((sum, v) => sum + v, 0);
  const totalXP = Math.max(25, totalEarnedPoints * 5);

  // Determine primary stat
  let highestStat: LifeAttribute = "discipline";
  let maxVal = -1;
  for (const attr of attributes) {
    if (baseGains[attr] > maxVal) {
      maxVal = baseGains[attr];
      highestStat = attr;
    }
  }

  const takeawayMap: Record<LifeAttribute, string> = {
    exercise: "Active Physical Push",
    intellect: "Academic & Intellectual Dedication",
    discipline: "Steadfast Habit Consistency",
    sleep: "Restful Night & Recovery",
    love: "Heartfelt Reflection & Gratitude",
    social: "Warm Social Connection",
  };

  const keyTakeaway = takeawayMap[highestStat] || "Consistent Daily Reflection";
  const feedback = `You demonstrated solid self-awareness and active commitment to personal growth today. Strong progression noted in ${LIFE_ATTRIBUTES[highestStat].name}.`;

  return {
    statGains: baseGains,
    totalXP,
    feedback,
    keyTakeaway,
    sentiment: "positive",
    suggestedFocus: highestStat,
  };
}
