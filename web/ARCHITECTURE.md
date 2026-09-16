# Altiora Web Architecture

Altiora is a client-interactive Next.js 16 application for quests, focus sessions, school schedules, and progression statistics. `app/page.tsx` remains a Server Component; it supplies the current date to the client-owned `AppShell`.

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
│   ├── quests/
│   │   ├── components/category-list.tsx
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
- active dock tab;
- the controlled Tasks subview, so pressing the Tasks dock button always resets Categories to All;
- the active quest detail, quest form, and focus-session entry points;
- focus completion coordination after the quest mutation layer commits successfully.

`use-app-navigation.ts` preserves the original dock scrolling, sheet-closing, reduced-motion, and Tasks-reset behavior.

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
- `use-quest-mutations.ts` owns optimistic completion, rollback errors, creation, and focus completion.
- `use-quest-reorder.ts` owns the original 200 ms hold threshold, 16 px cancellation threshold, haptics, auto-scroll, transforms, and 180 ms click suppression.
- `quest-firestore.ts` owns Firestore reads and writes.
- `quest-storage.ts` exclusively owns the `todo-quest-order-<uid>` localStorage key and ordering fallback.
- `date-utils.ts` is the shared pure date-formatting source for quest cards and details.

### School boundaries

- `SchoolView` composes the data, clock, and form hooks with focused period components.
- `PeriodCard` contains the unchanged period-row DOM and keyboard interaction.
- `use-periods-data.ts` owns cache-first hydration, subscription cleanup, optimistic local updates, and fire-and-forget Firestore persistence.
- `school-storage.ts` owns the `todo-quest-periods-<uid>` localStorage schema.

### Stats boundaries

`StatsView` composes focused sections. Attribute cards/details, the competitive-rank card, and history modal own their existing DOM without adding wrapper elements.

Progression stays local-first. `stats-storage.ts` owns `todo-quest-stats-v2-<uid>` and rollover persistence; `rank-math.ts` and `stats-chart-math.ts` contain pure calculations. Stats components do not write to Firestore.

### Authentication

`use-auth-user.ts` is the only Firebase Authentication consumer. It owns the auth-state unsubscribe cleanup and sign-in/sign-out error strings. `AuthShell` renders signed-out and loading states; `AppShell` renders authentication failures that occur while the user remains signed in.

## Styling invariant

`app/globals.css` remains the sole stylesheet. Component extraction must not change selector names, DOM hierarchy, declaration order, cascade order, media queries, SVG paths, animations, or inline style values. Only documentation comments may be added to this file.

## Where to make common changes

| Change | Location |
| --- | --- |
| Dock target or Tasks reset behavior | `app/use-app-navigation.ts` |
| Auth lifecycle or error text | `features/auth/hooks/use-auth-user.ts` |
| Signed-out/loading auth DOM | `features/auth/components/auth-shell.tsx` |
| Quest card DOM | `features/quests/components/quest-card.tsx` |
| All/Completed list composition | `features/quests/components/quest-list.tsx` |
| Category grouping UI | `features/quests/components/category-list.tsx` |
| Quest order localStorage | `features/quests/data/quest-storage.ts` |
| Quest Firestore paths and writes | `features/quests/data/quest-firestore.ts` |
| Focus timer behavior | `features/focus/hooks/use-focus-timer.ts` |
| Focus completion orchestration | `features/quests/hooks/use-quest-mutations.ts` and `app/app-shell.tsx` |
| Period row DOM | `features/school/components/period-card.tsx` |
| School persistence | `features/school/data/` and `features/school/hooks/use-periods-data.ts` |
| Attribute cards/details | `features/stats/components/attribute-*.tsx` |
| Rank card/history | `features/stats/components/competitive-rank-card.tsx` and `history-modal.tsx` |
| Rank and rollover math | `features/stats/domain/rank-math.ts` |

## Verification gates

Run from `web/`:

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
git diff --check
```

Behavior-preserving refactors also require deterministic visual screenshots, DOM-structure comparisons, console-error checks, listener cleanup inspection, exact storage-key inspection, and import-boundary searches before completion.
