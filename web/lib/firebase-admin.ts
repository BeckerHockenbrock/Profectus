import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
  }

  return JSON.parse(raw) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
}

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const serviceAccount = readServiceAccount();
  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
  });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getBotOwnerUid() {
  const uid = process.env.PROFECTUS_OWNER_UID?.trim();
  if (!uid) {
    throw new Error("PROFECTUS_OWNER_UID is not configured.");
  }
  return uid;
}

export function assertBotAuthorized(request: Request) {
  const expected = process.env.PROFECTUS_BOT_API_KEY?.trim();
  if (!expected) {
    throw new Error("PROFECTUS_BOT_API_KEY is not configured.");
  }

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const alt = request.headers.get("x-profectus-bot-key")?.trim() ?? "";
  const provided = bearer || alt;

  if (!provided || provided !== expected) {
    const error = new Error("Unauthorized");
    (error as Error & { status: number }).status = 401;
    throw error;
  }
}
