import { setQuestCompleted } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readQuestId(id: string) {
  const value = Number(id);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = readQuestId(rawId);
    const body: unknown = await request.json();

    if (!id || !body || typeof body !== "object" || typeof (body as { completed?: unknown }).completed !== "boolean") {
      return Response.json({ error: "That quest update is not valid." }, { status: 400 });
    }

    const quest = setQuestCompleted(id, (body as { completed: boolean }).completed);

    if (!quest) {
      return Response.json({ error: "Quest not found." }, { status: 404 });
    }

    return Response.json(quest);
  } catch {
    return Response.json({ error: "Could not update that quest." }, { status: 500 });
  }
}
