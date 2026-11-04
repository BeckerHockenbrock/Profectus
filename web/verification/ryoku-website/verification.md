# Ryoku website design correction

Verified November 4, 2026.

The reference is the [Ryoku website](https://ryoku.dev/), inspected directly in the browser. Its public stylesheet and rendered headings confirmed Fraunces, Space Grotesk, and Space Mono. Font licensing and upstream family sources were cross-checked against the [Google Fonts repository](https://github.com/google/fonts). Local Latin WOFF2 files and their licenses are in `public/fonts/`.

The implementation follows the site's editorial composition: oversized serif headings, small uppercase labels, numbered dividers, ruled data rows, square outlined controls, subtle grain, masthead navigation, and prominent original artwork. Profectus branding, monochrome colors, and functional app controls are retained. Orange circles and promotional paragraphs are absent.

## Checks

- `next build` passed, including TypeScript checks. The temporary fixture route was removed before the build.
- `eslint .` and `git diff --check` passed.
- Inspected desktop and 390px mobile quests, school, focus, and quest form layouts using actual components with local sample data.
- Opened and closed the new-quest form through the header action; navigation between views worked. Adding a 5-minute focus stone changed 25 to 30 minutes.
- Rendered headings use the local Fraunces face. At 390px, the quests page had no horizontal overflow. The actual sign-in route was checked at desktop, 390px, and 320px; the narrow-screen check had no horizontal overflow.
- Screenshots include the reference homepage and the resulting app screens. Original image rendering was preserved without CSS filter compositing after detecting an image visibility issue during browser verification.

Live Google sign-in and Firebase persistence were not exercised. Existing Next.js warnings about multiple lockfiles and Apple web-app metadata remain.
