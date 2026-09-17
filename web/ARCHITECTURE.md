# Todo Quest Web Architecture

Todo Quest is a client-interactive Next.js 16 task application with optional focus sessions. `app/page.tsx` remains a Server Component; it supplies the current date to the client-owned `AppShell`.

## Directory map

```text
web/
├── app/
│   ├── app-shell.tsx                 # Authenticated feature composition and modal ownership
│   ├── use-app-navigation.ts         # Dock navigation, Tasks reset, and scroll behavior
│   ├── globals.css                   # The single application stylesheet
│   ├── layout.tsx
│   ├── manifest.ts
│   └── page.tsx
├── components/
│   ├── navigation/
│   │   ├── app-header.tsx
│   │   └── liquid-dock.tsx
│   └── shared/
│       ├── home-screen-hint.tsx
│       └── use-sheet-swipe.ts
├── features/
│   ├── auth/
│   │   ├── components/auth-shell.tsx
│   │   └── hooks/use-auth-user.ts
│   ├── focus/
│   │   ├── components/focus-screen.tsx
│   │   ├── components/sisyphus-frame-animation.tsx
│   │   ├── domain/timer-format.ts
│   │   ├── hooks/use-focus-timer.ts
│   │   └── types/focus.ts
│   ├── journal/
│   │   ├── components/journal-entry-card.tsx
│   │   ├── components/journal-key-modal.tsx
│   │   ├── components/journal-view.tsx
│   │   ├── data/journal-api.ts
│   │   ├── data/journal-storage.ts
│   │   ├── domain/journal-heuristics.ts
│   │   ├── hooks/use-journal.ts
│   │   └── types/journal.ts
│   ├── quests/
│   │   ├── components/category-list.tsx
│   │   ├── components/date-list.tsx
│   │   ├── components/quest-card.tsx
│   │   ├── components/quest-form-modal.tsx
│   │   ├── components/quest-list.tsx
│   │   ├── components/task-detail-modal.tsx
│   │   ├── components/tasks-view.tsx
│   │   ├── data/quest-firestore.ts
│   │   ├── data/quest-storage.ts
│   │   ├── domain/date-utils.ts
│   │   ├── hooks/use-quest-mutations.ts
│   │   ├── hooks/use-quest-reorder.ts
│   │   ├── hooks/use-quest-subscription.ts
│   │   └── types/quest.ts
│   ├── school/
│   │   ├── components/period-card.tsx
│   │   ├── components/period-detail-modal.tsx
│   │   ├── components/period-form-modal.tsx
│   │   ├── components/period-icon.tsx
│   │   ├── components/school-view.tsx
│   │   ├── data/school-firestore.ts
│   │   ├── data/school-storage.ts
│   │   ├── domain/period-clock.ts
│   │   ├── hooks/use-period-clock.ts
│   │   ├── hooks/use-period-form.ts
│   │   ├── hooks/use-periods-data.ts
│   │   └── types/school.ts
│   └── stats/
│       ├── components/attribute-card.tsx
│       ├── components/attribute-detail-sheet.tsx
│       ├── components/competitive-rank-card.tsx
│       ├── components/history-modal.tsx
│       ├── components/radar-chart.tsx
│       ├── components/rank-badge.tsx
│       ├── components/stats-view.tsx
│       ├── data/stats-storage.ts
│       ├── domain/rank-math.ts
│       ├── domain/stats-chart-math.ts
│       ├── hooks/use-user-stats.ts
│       └── types/stats.ts
└── lib/firebase.ts
```

## Ownership and dependency rules

### App orchestration

`AppShell` owns only state that crosses feature boundaries:

- authenticated user composition;
- the controlled task subview, so the dock can switch between Today, All tasks, and Categories;
- the active quest detail, quest form, and focus-session entry points;
- focus completion coordination after the quest mutation layer commits successfully.

`use-app-navigation.ts` preserves dock scrolling, sheet-closing, and reduced-motion behavior.

### Presentation versus persistence

Files under `features/*/components` render UI and invoke callbacks. They do not import Firebase SDK operations or Firebase singletons.

Persistence is reached through feature hooks and data modules:

```text
FocusScreen
  -> injected onFinish callback
  -> AppShell
  -> useQuestMutations.finishFocusSession
  -> quest-firestore.completeQuestFocusSession
  -> Firestore transaction
```

The transaction reads and updates `users/{uid}/quests/{questId}`, sets `completed: true`, and adds only `Math.floor(elapsedSeconds / 60)` full minutes. A failed transaction rejects back to `FocusScreen`, which keeps the frozen session open and exposes Retry. Quit never invokes persistence.

### Quest boundaries

- `use-quest-subscription.ts` owns listener lifecycle and returns the unsubscribe cleanup.
- `use-quest-mutations.ts` owns optimistic completion, rollback errors, creation, subtask mutations, and focus completion.
- `use-quest-reorder.ts` owns the original 200 ms hold threshold, 16 px cancellation threshold, haptics, auto-scroll, transforms, and 180 ms click suppression.
- `quest-firestore.ts` owns Firestore reads and writes.
- `quest-storage.ts` exclusively owns the `todo-quest-order-<uid>` localStorage key and ordering fallback.
- `date-utils.ts` is the shared pure date-formatting source for quest cards and details.

### Authentication

`use-auth-user.ts` is the only Firebase Authentication consumer. It owns the auth-state unsubscribe cleanup and sign-in/sign-out error strings. `AuthShell` renders signed-out and loading states; `AppShell` renders authentication failures that occur while the user remains signed in.

## Styling invariant

`app/globals.css` remains the sole stylesheet. Component extraction must not change selector names, DOM hierarchy, declaration order, cascade order, media queries, SVG paths, animations, or inline style values. Only documentation comments may be added to this file.

## Where to make common changes

| Change | Location |
| --- | --- |
| Dock view selection | `app/use-app-navigation.ts` |
| Auth lifecycle or error text | `features/auth/hooks/use-auth-user.ts` |
| Signed-out/loading auth DOM | `features/auth/components/auth-shell.tsx` |
| Quest card DOM | `features/quests/components/quest-card.tsx` |
| All/Completed list composition | `features/quests/components/quest-list.tsx` |
| Category grouping UI | `features/quests/components/category-list.tsx` |
| Date grouping UI | `features/quests/components/date-list.tsx` |
| Quest order localStorage | `features/quests/data/quest-storage.ts` |
| Quest Firestore paths and writes | `features/quests/data/quest-firestore.ts` |
| Focus timer behavior | `features/focus/hooks/use-focus-timer.ts` |
| Focus completion orchestration | `features/quests/hooks/use-quest-mutations.ts` and `app/app-shell.tsx` |

## Verification gates

Run from `web/`:

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
git diff --check
```

Behavior-preserving refactors also require deterministic visual screenshots, DOM-structure comparisons, console-error checks, listener cleanup inspection, exact storage-key inspection, and import-boundary searches before completion.
