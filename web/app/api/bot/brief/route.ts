import { NextResponse } from "next/server";
import { assertBotAuthorized, getAdminDb, getBotOwnerUid } from "@/lib/firebase-admin";
import { botErrorResponse, isValidDateId, todayUtcDateId } from "@/lib/bot-http";

export async function GET(request: Request) {
  try {
    assertBotAuthorized(request);
    const ownerUid = getBotOwnerUid();
    const url = new URL(request.url);
    const date = url.searchParams.get("date")?.trim() || todayUtcDateId();

    if (!isValidDateId(date)) {
      return NextResponse.json({ ok: false, error: "date must be YYYY-MM-DD" }, { status: 400 });
    }

    const snapshot = await getAdminDb().collection("users").doc(ownerUid).collection("briefs").doc(date).get();
    if (!snapshot.exists) {
      return NextResponse.json({ ok: true, brief: null, date });
    }

    const data = snapshot.data() ?? {};
    return NextResponse.json({
      ok: true,
      date,
      brief: {
        id: snapshot.id,
        title: String(data.title ?? ""),
        body: String(data.body ?? ""),
        updatedAt: Number(data.updatedAt ?? 0),
        updatedBy: data.updatedBy === "user" ? "user" : "bot",
      },
    });
  } catch (error) {
    return botErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertBotAuthorized(request);
    const ownerUid = getBotOwnerUid();
    const payload = (await request.json()) as {
      date?: string;
      title?: string;
      body?: string;
    };

    const date = (payload.date?.trim() || todayUtcDateId());
    if (!isValidDateId(date)) {
      return NextResponse.json({ ok: false, error: "date must be YYYY-MM-DD" }, { status: 400 });
    }

    if (typeof payload.body !== "string") {
      return NextResponse.json({ ok: false, error: "body is required" }, { status: 400 });
    }

    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const body = payload.body;
    const updatedAt = Date.now();

    await getAdminDb().collection("users").doc(ownerUid).collection("briefs").doc(date).set(
      {
        title,
        body,
        updatedAt,
        updatedBy: "bot",
      },
      { merge: true },
    );

    return NextResponse.json({
      ok: true,
      brief: {
        id: date,
        title,
        body,
        updatedAt,
        updatedBy: "bot",
      },
    });
  } catch (error) {
    return botErrorResponse(error);
  }
}
