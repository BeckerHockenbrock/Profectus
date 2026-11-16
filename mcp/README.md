# Profectus MCP

Thin MCP server for Grok (or any MCP client). It signs in as a **Profectus user** and reads/writes that user's brief + quests through Firestore security rules. No shared bot API key, no single-owner account.

## Tools

| Tool | Purpose |
| --- | --- |
| `get_brief` | Read the signed-in user's brief for a date |
| `set_brief` | Write that user's brief (`body` required, optional `title` / `date`) |
| `list_quests` | List that user's quests |
| `create_quest` | Create a quest for that user |

## Per-user auth

1. Sign into Profectus in the browser.
2. Open **Account → Assistant access → Copy refresh token**.
3. Save it once:

```bash
cd mcp
npm install
export FIREBASE_API_KEY=...          # same as NEXT_PUBLIC_FIREBASE_API_KEY
export FIREBASE_PROJECT_ID=...       # same as NEXT_PUBLIC_FIREBASE_PROJECT_ID
node src/login.js <paste-refresh-token>
```

Credentials are stored at `~/.config/profectus/credentials.json` and only authorize that Firebase uid. Another person repeats the same steps with their own login — their bot only touches their data.

You can also set `PROFECTUS_FIREBASE_REFRESH_TOKEN` instead of using the login file.

## Run / Grok connector

```bash
FIREBASE_API_KEY=... FIREBASE_PROJECT_ID=... npm start
```

Example Cursor / Grok **command** connector:

```json
{
  "mcpServers": {
    "profectus": {
      "command": "node",
      "args": ["/absolute/path/to/Profectus/mcp/src/index.js"],
      "env": {
        "FIREBASE_API_KEY": "your-web-api-key",
        "FIREBASE_PROJECT_ID": "your-project-id"
      }
    }
  }
}
```

Writes go to `users/{thatUserUid}/briefs/*` and `users/{thatUserUid}/quests/*` using the user's Firebase ID token, so existing Firestore owner rules are what grant permission.
