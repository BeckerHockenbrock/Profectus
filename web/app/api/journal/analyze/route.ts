import { NextResponse } from "next/server";
import type { LifeAttribute } from "@/features/stats/types/stats";
import { LIFE_ATTRIBUTES } from "@/features/stats/types/stats";
import type { JournalStatEvaluation } from "@/features/journal/types/journal";

const STAT_DESCRIPTIONS: Record<LifeAttribute, string> = {
  discipline: "Consistency, morning routines, willpower, habits, chores, resistance to distraction, grit.",
  intellect: "Academics, studying, critical reading, homework, lectures, programming/coding, deep learning.",
  love: "Romance, self-compassion, heartfelt gratitude, kindness to family/partner, emotional health.",
  social: "Meaningful connections, calling family, spending quality time with friends, networking, community.",
  exercise: "Gym, intense workouts, running, lifting, cardio, sports, physical movement, pushing athletic limits.",
  sleep: "Sleep duration (7-9 hours optimal), sleep quality, bedtime consistency, dark room wind-down, physical recovery.",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entryText: string = body.entryText || "";
    const stat: LifeAttribute = body.stat || "discipline";

    if (!entryText.trim()) {
      return NextResponse.json(
        { success: false, error: "Journal entry text cannot be empty." },
        { status: 400 },
      );
    }

    if (!LIFE_ATTRIBUTES[stat]) {
      return NextResponse.json(
        { success: false, error: `Invalid stat attribute: ${stat}` },
        { status: 400 },
      );
    }

    // Resolve API key
    const serverKey = process.env.GEMINI_API_KEY;
    const headerKey = request.headers.get("x-gemini-api-key");
    const apiKey = (serverKey && serverKey.trim()) ? serverKey.trim() : (headerKey ? headerKey.trim() : "");

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_API_KEY",
          message:
            "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file or set it in the Journal settings modal.",
        },
        { status: 401 },
      );
    }

    const statName = LIFE_ATTRIBUTES[stat].name;
    const statContext = STAT_DESCRIPTIONS[stat];

    const systemPrompt = `You are Altiora's rigorous progression AI judge.
The user is submitting a journal entry specifically to evaluate their performance for: "${statName}" (${statContext}).

CRITICAL GRADING DIRECTIVE:
You must grade their performance on a strict 0 to 100 percentage scale ("score").
Points are intentionally difficult to earn. Do NOT be generous or inflated:
- 0-39%: Poor effort, procrastination, skipped habits, bad sleep, or excuses.
- 40-59%: Bare minimum, casual, half-hearted attempt without pushing resistance.
- 60-74%: Solid, respectable, standard daily consistency. This is where most decent days land.
- 75-84%: High performance, notable friction overcome, rigorous session.
- 85-94%: Elite execution, extraordinary grit, zero excuses, major athletic or intellectual breakthrough.
- 95-100%: Legendary, virtually flawless human mastery. Reserved strictly for extraordinary feats.

IMPORTANT:
- An honest, typical day of doing tasks should receive 60-72%.
- 80%+ must feel difficult and truly earned.
- 95-100% should be exceptionally rare.
- "score": integer 0-100.
- "xpEarned": integer calculated as round(score * 0.5 + 10) (between 15 and 65 XP).
- "feedback": 2 to 3 concise, candid, analytical sentences evaluating what they accomplished and what to elevate next.
- "keyTakeaway": punchy 3 to 5 word summary (e.g. "Relentless Discipline Push").
- "sentiment": "positive", "reflective", "challenging", or "neutral".

Output MUST be strictly valid JSON matching:
{
  "stat": "${stat}",
  "score": 72,
  "xpEarned": 46,
  "feedback": "...",
  "keyTakeaway": "...",
  "sentiment": "positive"
}`;

    const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash"];
    let lastError: Error | null = null;
    let successfulEvaluation: JournalStatEvaluation | null = null;
    let modelUsed = "";

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `${systemPrompt}\n\nUser's ${statName} Entry:\n"""\n${entryText}\n"""`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.25,
              responseMimeType: "application/json",
            },
          }),
        });

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          throw new Error(`Gemini API error (${geminiResponse.status}): ${errorText}`);
        }

        const data = await geminiResponse.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
          throw new Error("No response generated from Gemini Flash.");
        }

        const cleaned = candidateText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        const parsed = JSON.parse(cleaned);

        const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score || 50))));
        const xpEarned = Math.max(10, Math.min(100, Math.round(Number(parsed.xpEarned) || (score * 0.5 + 10))));

        successfulEvaluation = {
          stat,
          score,
          xpEarned,
          feedback: String(parsed.feedback || `Evaluated ${statName} reflection. Keep holding yourself to a high standard.`),
          keyTakeaway: String(parsed.keyTakeaway || `${statName} Check-in`),
          sentiment: parsed.sentiment || "positive",
        };

        modelUsed = model;
        break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (!successfulEvaluation) {
      throw lastError || new Error("Failed to evaluate entry with Gemini Flash.");
    }

    return NextResponse.json({
      success: true,
      evaluation: successfulEvaluation,
      modelUsed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error analyzing journal.";
    console.error("Journal analysis error:", message);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
