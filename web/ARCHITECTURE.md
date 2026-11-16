# Profectus Web Architecture

Profectus is a client-interactive Next.js 16 task application with a daily brief and a simple account surface. `app/page.tsx` remains a Server Component; it supplies the current date to the client-owned `AppShell`.

## Directory map

```text
web/
├── app/
│   ├── api/
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
│   ├── account/                      # Profile, theme, assistant token copy
│   ├── auth/
│   ├── brief/                        # Daily brief UI + Firestore subscribe
│   ├── construction/
│   ├── journal/                      # Present but not in dock
│   ├── quests/
│   └── stats/                        # Present but not in dock
└── lib/
    └── firebase.ts

mcp/                                  # Per-user MCP (Firebase user credentials)
├── src/index.js
├── src/firebase.js
└── src/login.js
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

Grok talks to `mcp/` tools. The MCP signs in as a real Profectus Firebase user (refresh token from Account → Assistant access) and writes through Firestore REST using that user's ID token. Owner rules on `users/{uid}/briefs` and `users/{uid}/quests` are the permission boundary — every user connects their own bot to their own data. No shared bot API key and no single-owner admin writer.

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
| MCP tools / user auth | `mcp/src/` |

## Verification gates

Run from `web/`:

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
git diff --check
```
