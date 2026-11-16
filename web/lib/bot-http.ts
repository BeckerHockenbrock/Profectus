import { NextResponse } from "next/server";

export function botErrorResponse(error: unknown) {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
      ? (error as { status: number }).status
      : 500;

  const message = error instanceof Error ? error.message : "Unexpected bot API error.";
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function isValidDateId(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function todayUtcDateId() {
  return new Date().toISOString().slice(0, 10);
}
