# Desktop rounding without layout changes

Checked 2026-11-04 using the real task components with local sample data in a temporary fixture.

- Reverted the shared-layout experiment and restored the original desktop sidebar, portrait inset, header position, content alignment, and dimensions.
- Desktop changes are `border-radius` declarations only: rounded panels, pill-shaped controls, and circular task checks, profile, and close buttons. The previously requested stats shadow removal remains.
- At 1280 x 720, navigation is a column at x=35px, y=216px; the shell retains 272px of left padding. Task corners measure 32px and completion checks have a 50% radius. There is no bottom navigation dock on desktop.
- At 390 x 844, the existing mobile dock remains at the bottom with grid layout. Document width is 390px, with no horizontal overflow. Mobile styling remains in its original media query.
- Removed the temporary fixture before the production build. Screenshots include the development indicator; no account persistence changes were exercised.

`desktop.jpg` shows the corrected desktop appearance. `mobile.jpg` records the mobile check.

Production build (including TypeScript), ESLint, and `git diff --check` pass. Existing Next.js workspace-root and metadata notices remain.
