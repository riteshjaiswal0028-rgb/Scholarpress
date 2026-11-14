# Android-first redesign pass (v56), on top of v55
Presentation and client-side view logic only. No server functions, queries (other than the home page sharing the Explore cache key), schema, auth, roles, upload or Capacitor code changed.

- Tokens: light and dark palettes set to the brief (porcelain #F7F6F1, forest #244B3D, brass #B39A68; dark #111713 / #A6C1AE / #C2A875). Muted text kept at AA contrast.
- Home: composed journal-volume graphic (SVG from tokens), "Browse by subject" chips from real subjects, a Featured panel (the newest published record: title, abstract, date, subject, type, DOI if present) and the rest as a list. Nothing is invented; sections hide when there is no data.
- Explore: filters move into a bottom sheet below lg (same controls and URL search params, unique ids per instance), horizontally scrolling subject chips, 48px controls. Desktop keeps the sticky Refine column.
- My research: search, status chips (only statuses present in the user's data), sort (newest, oldest, title), a "next step" link per submission. "Last updated" is not shown because the list query does not return it.
- Submit: five steps (File, Details, Authors, Declare, Review). Fields, validation rules, autosave/upload and submit logic are unchanged; the old first step is split in two: file and anonymized copy, then title through licence. Final submit still validates every earlier step.
- Article: "On this page" tabs are sticky under the header.

Not done: Notifications tab (no data model), related research (no data source), figure/table and reference restyling in the reader, dialog/toast/upload component restyle, landscape and tablet layouts, per-viewport screenshots.
Checks: NOT built, NOT viewed. TypeScript syntax-only parse of edited files is clean. First step: `bun install && vite build && tsc --noEmit && vitest run` (baseline: build ok, 5 tsc errors, 464 pass / 2 fail), then look at 360, 393 and 432 px wide in light and dark.
