#!/usr/bin/env node
import {
  credentialsPath,
  getFirebaseConfig,
  saveCredentials,
} from "./firebase.js";

const token = process.argv[2]?.trim() || process.env.PROFECTUS_FIREBASE_REFRESH_TOKEN?.trim();

if (!token) {
  console.error(`Usage: node mcp/src/login.js <firebase-refresh-token>

1. Sign into Profectus in the browser
2. Open Account → Assistant access → Copy refresh token
3. Run this command with that token

Credentials are saved to:
  ${credentialsPath()}

Firebase project config still comes from env:
  FIREBASE_API_KEY / NEXT_PUBLIC_FIREBASE_API_KEY
  FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_PROJECT_ID`);
  process.exit(1);
}

try {
  getFirebaseConfig();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const { apiKey } = getFirebaseConfig();
const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: token,
  }),
});

const data = await response.json();
if (!response.ok) {
  console.error(data.error?.message || `Login failed (${response.status})`);
  process.exit(1);
}

const path = await saveCredentials({
  refreshToken: data.refresh_token || token,
  uid: data.user_id,
  email: null,
  updatedAt: new Date().toISOString(),
});

console.log(`Signed in as uid ${data.user_id}`);
console.log(`Saved credentials to ${path}`);
console.log("Grok/MCP tools will now read and write only this user's Profectus data.");
