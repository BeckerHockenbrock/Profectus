import { homedir } from "node:os";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const CREDENTIALS_PATH =
  process.env.PROFECTUS_CREDENTIALS_PATH ||
  join(homedir(), ".config", "profectus", "credentials.json");

function requiredEnv(name, fallbackNames = []) {
  const names = [name, ...fallbackNames];
  for (const key of names) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  throw new Error(`Missing ${names.join(" or ")}.`);
}

export function getFirebaseConfig() {
  return {
    apiKey: requiredEnv("FIREBASE_API_KEY", ["NEXT_PUBLIC_FIREBASE_API_KEY"]),
    projectId: requiredEnv("FIREBASE_PROJECT_ID", ["NEXT_PUBLIC_FIREBASE_PROJECT_ID"]),
  };
}

export async function loadStoredCredentials() {
  try {
    const raw = await readFile(CREDENTIALS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (typeof parsed.refreshToken === "string" && parsed.refreshToken) {
      return {
        refreshToken: parsed.refreshToken,
        uid: typeof parsed.uid === "string" ? parsed.uid : null,
        email: typeof parsed.email === "string" ? parsed.email : null,
      };
    }
  } catch {
    // no stored credentials
  }
  return null;
}

export async function saveCredentials(credentials) {
  await mkdir(dirname(CREDENTIALS_PATH), { recursive: true });
  await writeFile(CREDENTIALS_PATH, `${JSON.stringify(credentials, null, 2)}\n`, {
    mode: 0o600,
  });
  return CREDENTIALS_PATH;
}

export function credentialsPath() {
  return CREDENTIALS_PATH;
}

let cachedSession = null;

export async function getUserSession() {
  if (cachedSession && cachedSession.expiresAt > Date.now() + 60_000) {
    return cachedSession;
  }

  const { apiKey, projectId } = getFirebaseConfig();
  const envToken = process.env.PROFECTUS_FIREBASE_REFRESH_TOKEN?.trim();
  const stored = envToken ? null : await loadStoredCredentials();
  const refreshToken = envToken || stored?.refreshToken;

  if (!refreshToken) {
    throw new Error(
      `No Firebase user credentials. In Profectus → Account, copy your assistant refresh token, then run: node mcp/src/login.js <token>`,
    );
  }

  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Firebase token refresh failed (${response.status})`);
  }

  const session = {
    apiKey,
    projectId,
    idToken: data.id_token,
    refreshToken: data.refresh_token || refreshToken,
    uid: data.user_id,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };

  if (!envToken) {
    await saveCredentials({
      refreshToken: session.refreshToken,
      uid: session.uid,
      email: stored?.email ?? null,
      updatedAt: new Date().toISOString(),
    });
  }

  cachedSession = session;
  return session;
}

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeValue) } };
  }
  if (typeof value === "object") {
    const fields = {};
    for (const [key, nested] of Object.entries(value)) {
      fields[key] = encodeValue(nested);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function decodeValue(node) {
  if (!node || typeof node !== "object") return null;
  if ("stringValue" in node) return node.stringValue;
  if ("booleanValue" in node) return node.booleanValue;
  if ("integerValue" in node) return Number(node.integerValue);
  if ("doubleValue" in node) return Number(node.doubleValue);
  if ("nullValue" in node) return null;
  if ("arrayValue" in node) return (node.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in node) {
    const out = {};
    for (const [key, nested] of Object.entries(node.mapValue.fields || {})) {
      out[key] = decodeValue(nested);
    }
    return out;
  }
  return null;
}

function decodeDocument(doc) {
  if (!doc) return null;
  const fields = {};
  for (const [key, nested] of Object.entries(doc.fields || {})) {
    fields[key] = decodeValue(nested);
  }
  const parts = String(doc.name || "").split("/");
  return { id: parts[parts.length - 1] || "", ...fields };
}

function encodeFields(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = encodeValue(value);
  }
  return fields;
}

async function firestore(path, { method = "GET", body, query } = {}) {
  const session = await getUserSession();
  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${session.projectId}/databases/(default)/documents/${path}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${session.idToken}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Firestore returned non-JSON (${response.status}): ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(data.error?.message || `Firestore error (${response.status})`);
  }

  return data;
}

export async function getBrief(date) {
  const session = await getUserSession();
  const doc = await firestore(`users/${session.uid}/briefs/${date}`);
  if (!doc) return { ok: true, date, brief: null, uid: session.uid };
  return { ok: true, date, brief: decodeDocument(doc), uid: session.uid };
}

export async function setBrief({ date, title = "", body }) {
  const session = await getUserSession();
  const updatedAt = Date.now();
  const payload = {
    title,
    body,
    updatedAt,
    updatedBy: "bot",
  };

  const saved = await firestore(`users/${session.uid}/briefs/${date}`, {
    method: "PATCH",
    body: {
      fields: encodeFields(payload),
    },
  });

  return {
    ok: true,
    uid: session.uid,
    brief: decodeDocument(saved) || { id: date, ...payload },
  };
}

export async function listQuests({ completed, limit = 50 } = {}) {
  const session = await getUserSession();
  const pageSize = Math.min(Math.max(Number(limit) || 50, 1), 200);

  // Structured query keeps filtering server-side when possible.
  const filters = [];
  if (typeof completed === "boolean") {
    filters.push({
      fieldFilter: {
        field: { fieldPath: "completed" },
        op: "EQUAL",
        value: { booleanValue: completed },
      },
    });
  }

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${session.projectId}/databases/(default)/documents/users/${session.uid}:runQuery`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.idToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "quests" }],
          ...(filters.length
            ? {
                where:
                  filters.length === 1
                    ? filters[0]
                    : { compositeFilter: { op: "AND", filters } },
              }
            : {}),
          orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
          limit: pageSize,
        },
      }),
    },
  );

  const rows = await response.json();
  if (!response.ok) {
    throw new Error(rows.error?.message || `Quest query failed (${response.status})`);
  }

  const quests = (Array.isArray(rows) ? rows : [])
    .map((row) => (row.document ? decodeDocument(row.document) : null))
    .filter(Boolean)
    .map((quest) => ({
      id: quest.id,
      title: String(quest.title ?? ""),
      description: String(quest.description ?? ""),
      category: String(quest.category ?? "General"),
      dueDate: String(quest.dueDate ?? ""),
      completed: Boolean(quest.completed),
      focusMinutes: Number(quest.focusMinutes ?? 0),
      createdAt: Number(quest.createdAt ?? 0),
      order: typeof quest.order === "number" ? quest.order : undefined,
    }));

  return { ok: true, uid: session.uid, quests };
}

export async function createQuest({ title, description = "", category = "General", dueDate = "" }) {
  const session = await getUserSession();
  const cleanTitle = String(title || "").trim();
  const cleanCategory = String(category || "General").trim().slice(0, 80) || "General";
  const cleanDescription = String(description || "").trim().slice(0, 1000);
  const cleanDueDate = String(dueDate || "").trim();

  if (!cleanTitle || cleanTitle.length > 160) {
    throw new Error("title is required and must be <= 160 characters");
  }
  if (cleanDueDate && !/^\d{4}-\d{2}-\d{2}$/.test(cleanDueDate)) {
    throw new Error("dueDate must be YYYY-MM-DD or empty");
  }

  const existing = await listQuests({ limit: 50 });
  const minOrder = existing.quests.reduce(
    (min, quest) => Math.min(min, typeof quest.order === "number" ? quest.order : 0),
    0,
  );
  const createdAt = Date.now();

  const created = await firestore(`users/${session.uid}/quests`, {
    method: "POST",
    body: {
      fields: encodeFields({
        title: cleanTitle,
        description: cleanDescription,
        category: cleanCategory,
        dueDate: cleanDueDate,
        completed: false,
        focusMinutes: 0,
        order: minOrder - 1,
        createdAt,
        subtasks: [],
      }),
    },
  });

  const quest = decodeDocument(created);
  return {
    ok: true,
    uid: session.uid,
    quest: {
      id: quest?.id,
      title: cleanTitle,
      description: cleanDescription,
      category: cleanCategory,
      dueDate: cleanDueDate,
      completed: false,
      focusMinutes: 0,
      createdAt,
      order: minOrder - 1,
    },
  };
}

export function todayUtcDateId() {
  return new Date().toISOString().slice(0, 10);
}

export function isValidDateId(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
