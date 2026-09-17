import { NextResponse } from "next/server";
import type { JournalAnalysis } from "@/features/journal/types/journal";

const SYSTEM_PROMPT = `You are Altiora's progression and gamification AI coach.
Your job is to analyze the user's daily journal entry and reward XP and stat gains across 6 core life attributes:
1. discipline - habits, consistency, morning routines, grit, chores, focus, willpower
2. intellect - study, academics, homework, reading, coding, learning, research, critical thinking
3. love - romance, affection, self-care, deep gratitude, kindness, emotional health, compassion
4. social - friendships, family calls, hangouts, team activities, conversations, community
5. exercise - gym, workouts, lifting, running, cardio, sports, walking, physical movement
6. sleep - sleep hygiene, hours rested, bedtime consistency, naps, recovery

SCORING RULES:
- For each of the 6 attributes, award an integer score between 0 and 15 based on the user's activities and reflections described in the entry.
- If an attribute was not mentioned or practiced, assign 0.
- "totalXP": sum of all awarded stat points multiplied by 5, plus 15 XP for taking the time to journal (integer between 20 and 150).
- "feedback": 2 to 3 concise, motivating sentences evaluating their day, praising wins, and giving actionable insight.
- "keyTakeaway": a short, punchy 3 to 6 word title/summary for the entry (e.g. "Unstoppable Cognitive & Physical Grind").
- "sentiment": one of "positive", "reflective", "challenging", "neutral".
- "suggestedFocus": one of the 6 attributes ("discipline", "intellect", "love", "social", "exercise", "sleep") that they could build upon tomorrow.

Output MUST be strictly valid JSON matching this structure:
{
  "statGains": {
    "discipline": 0,
    "intellect": 0,
    "love": 0,
    "social": 0,
    "exercise": 0,
    "sleep": 0
  },
  "totalXP": 50,
  "feedback": "...",
  "keyTakeaway": "...",
  "sentiment": "positive",
  "suggestedFocus": "intellect"
}`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entryText: string = body.entryText || "";

    if (!entryText.trim()) {
      return NextResponse.json(
        { success: false, error: "Journal entry text cannot be empty." },
        { status: 400 },
      );
    }

    // Resolve API key: check process.env first, then request header
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

    // Models to attempt (free-tier endpoints in priority order)
    const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash"];
    let lastError: Error | null = null;
    let successfulAnalysis: JournalAnalysis | null = null;
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
                    text: `${SYSTEM_PROMPT}\n\nUser's Journal Entry to analyze:\n"""\n${entryText}\n"""`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
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

        // Clean any accidental markdown code fences
        const cleaned = candidateText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        const parsed = JSON.parse(cleaned);

        // Sanitize stat gains
        const statGains = {
          discipline: Math.max(0, Math.min(25, Number(parsed.statGains?.discipline || 0))),
          intellect: Math.max(0, Math.min(25, Number(parsed.statGains?.intellect || 0))),
          love: Math.max(0, Math.min(25, Number(parsed.statGains?.love || 0))),
          social: Math.max(0, Math.min(25, Number(parsed.statGains?.social || 0))),
          exercise: Math.max(0, Math.min(25, Number(parsed.statGains?.exercise || 0))),
          sleep: Math.max(0, Math.min(25, Number(parsed.statGains?.sleep || 0))),
        };

        const totalStatSum = Object.values(statGains).reduce((sum, v) => sum + v, 0);
        const totalXP = Math.max(20, Number(parsed.totalXP) || (totalStatSum * 5 + 15));

        successfulAnalysis = {
          statGains,
          totalXP,
          feedback: String(parsed.feedback || "Good reflection today. Keep building your daily momentum!"),
          keyTakeaway: String(parsed.keyTakeaway || "Daily Reflection Complete"),
          sentiment: parsed.sentiment || "positive",
          suggestedFocus: parsed.suggestedFocus || "discipline",
        };

        modelUsed = model;
        break; // Successfully got analysis
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (!successfulAnalysis) {
      throw lastError || new Error("Failed to generate analysis from Gemini Flash models.");
    }

    return NextResponse.json({
      success: true,
      analysis: successfulAnalysis,
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
