import { NextResponse } from "next/server";
import { assertBotAuthorized, getAdminDb, getBotOwnerUid } from "@/lib/firebase-admin";
import { botErrorResponse } from "@/lib/bot-http";

type QuestDoc = {
  title?: unknown;
  description?: unknown;
  category?: unknown;
  dueDate?: unknown;
  completed?: unknown;
  focusMinutes?: unknown;
  createdAt?: unknown;
  order?: unknown;
  subtasks?: unknown;
};

function mapQuest(id: string, data: QuestDoc) {
  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    category: String(data.category ?? "General"),
    dueDate: String(data.dueDate ?? ""),
    completed: Boolean(data.completed),
    focusMinutes: Number(data.focusMinutes ?? 0),
    createdAt: Number(data.createdAt ?? 0),
    order: typeof data.order === "number" ? data.order : undefined,
  };
}

export async function GET(request: Request) {
  try {
    assertBotAuthorized(request);
    const ownerUid = getBotOwnerUid();
    const url = new URL(request.url);
    const completedParam = url.searchParams.get("completed");
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "50") || 50, 1), 200);

    let query = getAdminDb()
      .collection("users")
      .doc(ownerUid)
      .collection("quests")
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (completedParam === "true" || completedParam === "false") {
      query = getAdminDb()
        .collection("users")
        .doc(ownerUid)
        .collection("quests")
        .where("completed", "==", completedParam === "true")
        .orderBy("createdAt", "desc")
        .limit(limit);
    }

    const snapshot = await query.get();
    const quests = snapshot.docs.map((item) => mapQuest(item.id, item.data() as QuestDoc));

    return NextResponse.json({ ok: true, quests });
  } catch (error) {
    return botErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertBotAuthorized(request);
    const ownerUid = getBotOwnerUid();
    const payload = (await request.json()) as {
      title?: string;
      description?: string;
      category?: string;
      dueDate?: string;
    };

    const title = payload.title?.trim() ?? "";
    const category = (payload.category?.trim() || "General").slice(0, 80);
    const description = (payload.description ?? "").trim().slice(0, 1000);
    const dueDate = typeof payload.dueDate === "string" ? payload.dueDate.trim() : "";

    if (!title || title.length > 160) {
      return NextResponse.json(
        { ok: false, error: "title is required and must be <= 160 characters" },
        { status: 400 },
      );
    }

    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json({ ok: false, error: "dueDate must be YYYY-MM-DD or empty" }, { status: 400 });
    }

    const questsRef = getAdminDb().collection("users").doc(ownerUid).collection("quests");
    const existing = await questsRef.orderBy("order", "asc").limit(1).get();
    const minOrder =
      existing.docs.length > 0 && typeof existing.docs[0]!.data().order === "number"
        ? Number(existing.docs[0]!.data().order)
        : 0;

    const createdAt = Date.now();
    const docRef = await questsRef.add({
      title,
      description,
      category,
      dueDate,
      completed: false,
      focusMinutes: 0,
      order: minOrder - 1,
      createdAt,
      subtasks: [],
    });

    return NextResponse.json({
      ok: true,
      quest: {
        id: docRef.id,
        title,
        description,
        category,
        dueDate,
        completed: false,
        focusMinutes: 0,
        createdAt,
        order: minOrder - 1,
      },
    });
  } catch (error) {
    return botErrorResponse(error);
  }
}
