# Profectus MCP

Thin MCP server for Grok (or any MCP client) to read/write the daily brief and create/list quests. No prompts — content is supplied by the caller.

## Tools

| Tool | Purpose |
| --- | --- |
| `get_brief` | Read brief for a date |
| `set_brief` | Write brief (`body` required, optional `title` / `date`) |
| `list_quests` | List quests |
| `create_quest` | Create a quest |

## Environment

| Variable | Purpose |
| --- | --- |
| `PROFECTUS_APP_URL` | Base URL of the Next app (e.g. `https://your-host` or `http://127.0.0.1:3000`) |
| `PROFECTUS_BOT_API_KEY` | Shared secret; must match the web app |

## Run

```bash
cd mcp
npm install
PROFECTUS_APP_URL=http://127.0.0.1:3000 PROFECTUS_BOT_API_KEY=... npm start
```

Example MCP client config:

```json
{
  "mcpServers": {
    "profectus": {
      "command": "node",
      "args": ["/absolute/path/to/Profectus/mcp/src/index.js"],
      "env": {
        "PROFECTUS_APP_URL": "http://127.0.0.1:3000",
        "PROFECTUS_BOT_API_KEY": "your-shared-secret"
      }
    }
  }
}
```

The web app also needs `PROFECTUS_BOT_API_KEY`, `PROFECTUS_OWNER_UID`, and `FIREBASE_SERVICE_ACCOUNT_JSON` so the `/api/bot/*` routes can write to Firestore.
