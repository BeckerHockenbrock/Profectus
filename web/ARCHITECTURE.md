# Profectus Web Architecture

Profectus is a client-interactive Next.js 16 task application with a daily brief and a simple account surface. `app/page.tsx` remains a Server Component; it supplies the current date to the client-owned `AppShell`.

## Directory map

```text
web/
├── app/
│   ├── api/
│   │   ├── bot/
│   │   │   ├── brief/route.ts        # Bot read/write daily brief
│   │   │   └── quests/route.ts       # Bot list/create quests
│   │   └── journal/analyze/route.ts
│   ├── app-shell.tsx                 # Authenticated feature composition
│   ├── use-app-navigation.ts         # Dock navigation and scroll behavior
│   ├── globals.css
│   ├── ryoku-theme.css
│   ├── layout.tsx
│   ├── manifest.ts
│   └── page.tsx
├── components/
│   ├── navigation/
│   │   ├── app-header.tsx
│   │   └── liquid-dock.tsx
│   └── shared/
├── features/
│   ├── account/                      # Simple profile, theme, light totals
│   ├── auth/
│   ├── brief/                        # Daily brief UI + Firestore subscribe
│   ├── construction/
│   ├── journal/                      # Present but not in dock
│   ├── quests/
│   └── stats/                        # Present but not in dock
└── lib/
    ├── firebase.ts
    ├── firebase-admin.ts
    └── bot-http.ts

mcp/                                  # Thin MCP server for Grok bot R/W
└── src/index.js
```

## Ownership and dependency rules

### App orchestration

`AppShell` owns only state that crosses feature boundaries:

- authenticated user composition;
- the active application tab (`brief`, `tasks`, `account`);
- quest detail and quest form entry points.

`use-app-navigation.ts` preserves dock scrolling, sheet-closing, and reduced-motion behavior across primary tabs.

### Presentation versus persistence

Files under `features/*/components` render UI and invoke callbacks. They do not import Firebase SDK operations or Firebase singletons.

Persistence is reached through feature hooks and data modules.

### Authentication

`use-auth-user.ts` is the only Firebase Authentication consumer. It owns the auth-state unsubscribe cleanup and sign-in/sign-out error strings. `AuthShell` renders signed-out and loading states; `AppShell` renders authentication failures that occur while the user remains signed in.

### Bot / MCP path

Grok (or any MCP client) talks to `mcp/` tools only. Those tools call `/api/bot/*` with `PROFECTUS_BOT_API_KEY`. The API routes use the Admin SDK (`FIREBASE_SERVICE_ACCOUNT_JSON`) to read/write the owner account identified by `PROFECTUS_OWNER_UID`. No prompts live in the MCP or API — callers supply content.

## Styling invariant

`app/globals.css` supplies base component layouts and neutral colors for component states. `app/ryoku-theme.css` loads after it and implements the image-led Ryoku settings reference: a narrow desktop navigation rail, self-hosted Fraunces headings, Space Grotesk body text, Space Mono labels, and translucent task surfaces with backdrop blur. Account themes (`dawn`, `slate`) override CSS variables via `html[data-theme]`. Root-level `WorkspaceScene` places the generated halftone marble portrait behind sign-in and workspace tabs. Navigation moves to the bottom on mobile.

## Where to make common changes

| Change | Location |
| --- | --- |
| Dock view selection | `app/use-app-navigation.ts` |
| Auth lifecycle or error text | `features/auth/hooks/use-auth-user.ts` |
| Daily brief UI / subscribe | `features/brief/` |
| Account prefs / theme / avatar | `features/account/` |
| Quest Firestore paths and writes | `features/quests/data/quest-firestore.ts` |
| Bot brief/quest HTTP API | `app/api/bot/` |
| MCP tools | `mcp/src/index.js` |

## Verification gates

Run from `web/`:

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
git diff --check
```
