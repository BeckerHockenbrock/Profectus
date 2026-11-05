# Stats blended into the portrait

Checked 2026-11-04 at 390 x 844, 320 x 740, and the default 1280px desktop viewport. Used the real TasksView and portrait with local sample counts matching the supplied screenshot: 14 open, 5 today, 165 done.

- Removed the enclosing pill, background fill, borders, dividers, and backdrop blur from the stats row.
- Set the numbers in Fraunces, with spaced mono labels, a soft text shadow, and an edge-free radial shade behind the row. The image texture stays visible between and behind the numbers.
- The task list retains its existing glass surface, making the two sections visually distinct.
- Checked the computed transparent background, zero border, no backdrop filter, and all three counts. At 320px, document and viewport widths both measured 320px.

Screenshots: `mobile-390.jpg`, `mobile-320.jpg`, and `desktop.jpg`. The temporary component fixture was removed before the production build; no account data or persistence behavior changed. Development screenshots include the Next.js indicator.

Production build (including TypeScript), ESLint, and `git diff --check` pass. The first sandboxed build encountered a Windows EPERM on a generated directory; rerunning the same build outside the sandbox passed. Existing Next.js metadata and workspace-root notices remain.
