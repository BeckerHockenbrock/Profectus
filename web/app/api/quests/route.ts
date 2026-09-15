import { createQuest, getQuests } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readNewQuest(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const input = value as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const category = typeof input.category === "string" ? input.category.trim() : "";
  const dueDate = typeof input.dueDate === "string" ? input.dueDate : "";

  if (!title || !category || title.length > 160 || category.length > 80 || description.length > 1000) {
    return undefined;
  }

  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return undefined;
  }

  return { title, description, category, dueDate };
}

export function GET() {
  return Response.json(getQuests());
}

export async function POST(request: Request) {
  try {
    const input = readNewQuest(await request.json());

    if (!input) {
      return Response.json({ error: "A quest needs a title and category." }, { status: 400 });
    }

    const quest = createQuest(input);
    return Response.json(quest, { status: 201 });
  } catch {
    return Response.json({ error: "Could not create that quest." }, { status: 500 });
  }
}
