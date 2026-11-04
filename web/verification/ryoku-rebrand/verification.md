# Ryoku-inspired visual rebrand

Verified November 4, 2026.

## Direction and references

The [Ryoku website](https://ryoku.dev/) and [Ryoku repository](https://github.com/Ryoku-dev/ryoku) describe a continuous shell with black surfaces, warm bone text, and coordinated accents. The [official showroom](https://ryoku.dev/showroom) supplied the visual reference for the rail, artwork, and independent panels. Profectus keeps its classical artwork, using a muted ember palette, editorial headings, small monospace labels, and a floating navigation dock.

## Verification

| Check | Result |
| --- | --- |
| TypeScript | `tsc --noEmit` passed; production build type checking also passed. |
| Lint | `eslint .` passed. |
| Production build | `next build` passed. Temporary preview route absent from route output. |
| Production response | HTTP 200; compiled theme stylesheet present after base stylesheet. |
| Welcome | Actual signed-out route inspected at desktop and phone widths. |
| Tasks | Actual components with sample quests: Dates/Categories switching, completion, and overview counts checked. Completing one quest changed open/today/completed counts from 4/2/1 to 3/1/2. |
| Editing | Actual quest form opened and closed at phone width; fields and submit control visible. |
| School | Empty state and built-in sample schedule inspected; navigation and period list visible. |
| Focus | Adding a 5-minute stone changed 25 to 30 minutes. Started countdown, paused it, and used the quit confirmation to return. |
| Responsive | Inspected 1280px desktop, 820px tablet, 390px phone, and 320px narrow phone. DOM checks confirmed no horizontal overflow at 820px and 320px. |

Authenticated screens were checked through a temporary local component fixture, removed before the final build. Screenshots in this folder are development-preview captures using sample data. Live Google sign-in and Firebase persistence were not exercised. A production browser recheck encountered a local connection refusal after restarting the preview server; a direct local HTTP check succeeded. Existing Next.js warnings about multiple lockfiles and Apple web-app metadata remain.

## Captures

- `welcome-desktop.jpg`, `welcome-mobile.jpg`
- `tasks-desktop.jpg`, `tasks-mobile.jpg`
- `school-desktop.jpg`
- `focus-desktop.jpg`, `focus-timer-mobile.jpg`
- `quest-form-mobile.jpg`

## Follow-up: Profectus name and circle removal

Removed the sun decoration from the shared feature artwork and welcome screen, along with its unused CSS. Renamed the header, welcome brand, accessible labels, home-screen hint, browser metadata, install manifest, and break-completion title to Profectus. Existing local-storage identifiers remain compatible with saved data.

Production build and lint passed. The production welcome screen was visually inspected: header and document title both read Profectus, application-name metadata reads Profectus, and no `.workspaceSun` elements are present. `profectus-no-circle.jpg` is the updated production capture; earlier captures above document the original rebrand.
