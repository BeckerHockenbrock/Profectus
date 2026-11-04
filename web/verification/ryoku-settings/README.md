# Ryoku settings reference verification

Checked 2026-11-04 against the supplied settings screenshot, https://ryoku.dev/ and https://github.com/Ryoku-dev/ryoku.

- Replaced active workspace illustrations with one dominant generated monochrome portrait behind all surfaces.
- Desktop: narrow navigation rail, image fills the main canvas, tasks overlap the image with a computed `backdrop-filter: blur(18px)`.
- Mobile: checked 390 x 844 and 320 x 740; 320px viewport and document scroll widths both equal 320px. Task blur computes to 20px.
- Opened and dismissed the new-quest sheet. Navigated Quests, School and Focus. Added five minutes to a 25-minute focus stack and observed 30 minutes. Completed a sample task and observed updated list/counts.
- Checked the real sign-in screen with the shared portrait and glass card.

Workspace screenshots use real app components with local sample tasks in a temporary fixture route; Firebase account persistence was not exercised. The fixture route was removed before the production build. Screenshots retain the development-mode Next.js indicator.

Images: `desktop.jpg`, `mobile.jpg`, `school-desktop.jpg`, `focus-desktop.jpg`, `sign-in.jpg`.

Production build (including TypeScript) and ESLint pass. The initial build found stale generated types from the deleted fixture route; clearing only `.next/dev/types` resolved that. The final build contains no fixture route. Existing Next.js notices about multiple lockfiles and Apple web app metadata remain.
