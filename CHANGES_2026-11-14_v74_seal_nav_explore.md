# v74: round seal everywhere, pill bottom tabs, Explore skeletons

- Logo: header mark was an old book-shaped SVG. Now the round S seal (`/scholarpress-seal.png`) in the header, the phone menu sheet and the footer (round, light disc in dark mode). Android launcher icons, favicons, PDF stamp and maintenance screen already used the round seal.
- Bottom tabs: icon sits in a pill that fills when active (filled icon, bolder label), larger icons and tap area; old top bar removed.
- Explore: search is now first and sticks under the header. Page opens at once with skeleton rows (and skeleton chips) instead of waiting; results stay visible while a new search loads. Error state with retry.
- Explore "Published | My submissions" switch (signed-in only, `?view=mine`): lists the user's own submitted articles with status, linked to /my-research/$id. Unpublished manuscripts are NOT shown publicly.
- Files: site-header.tsx, mobile-nav.tsx, article-row.tsx (ArticleRowSkeleton), routes/explore.tsx, styles.css (v74 block).
- Checks: syntax-checked only. node_modules and network were not available, so tsc, vitest and vite build were NOT run; nothing viewed on a device.

## Home: pillars and figures matched to the mockup
- Four pillars: thin 1.5 stroke icons (book, shield-check, globe, diamond), two-line centred labels (Trusted/Publishing, Rigorous/Peer Review, Global/Reach, Academic/Excellence), short vertical dividers between them.
- Figures card: smaller icons, bold sans numbers, short dividers, tighter padding.
- Numbers stay LIVE (no invented figures): shown compact like "12K+"; "+" appears only when the count was rounded down, small counts show exactly.

## UX pass 2
- Bottom nav: unread count badge on the Notifications tab (signed-in users only, from the same notifications query; hidden while on the Notifications page; screen readers hear "N unread").
- Home "Our publishing process": step labels split on two lines like the mockup (Submit / Your Manuscript, Undergo / Peer Review, Get Published).
- Still not run: tsc, tests, vite build (no node_modules or network here). Run `npm i && npm run build` first, then check Home, Explore and the bottom tabs on a phone.
- Ideas for next round: pull-to-refresh on Explore, saved searches, sort and filter sheet on Explore, empty-state illustrations.

## Pull-to-refresh (public site + admin)
- New `src/components/pull-to-refresh.tsx`, mounted once in `routes/__root.tsx` so every page, admin included, gets it. Touch only; pull down at the top of a page, release past ~72px, and all cached queries plus route data are refreshed. Ignored inside fields, dialogs and scrolling panels. Spinner respects layout/safe-area. Not run on a device yet.

## Explore: active filter chips
- Every active search/filter (search text, record type, subject, year, peer reviewed) shows as a removable chip above the results, plus "Clear all" (keeps the Published / My submissions choice). Chips scroll sideways on a phone; each has a 40px tap target.
- Note: the Filters and Sort sheet already existed in v73, so it was not rebuilt.

## Empty states
- New shared `components/empty-state.tsx` (round icon, title, one line, next-step button).
- Used in Explore (no matches -> "Clear all filters"; nothing published -> "Submit research"; My submissions) and My Research. Notifications already had a good one.

## Design System 2.0 brief: first pass
- Audit written: AUDIT_DESIGN_SYSTEM_2.md (code-read only, nothing measured).
- Font preload (Inter, Source Serif 4) in routes/__root.tsx; removed hard-coded #FBF4E8 from site-header.tsx in favour of the `foreground` token.
- Remaining roadmap is in the audit file under "Not done".

## Article page polish
- Record type, article type, subject and keyword chips use a small radius (rounded-md) instead of pills; the three header actions share one 44px height; references have stable anchors (#ref-N); anchored sections clear the sticky header plus the "On this page" tabs.

## Reviewer and admin loading
- Reviewer "My reviews": skeleton cards while loading, shared EmptyState when there is nothing.
- Admin manuscript report: skeleton lines instead of the "Loading report…" text. Admin dashboard already had the PageLoading skeleton; admin's inline empty texts were left as is (they sit inside bordered sections).

## Forms
- Global invalid-field style (destructive border and focus ring) for anything with aria-invalid, so profile, submit, referral and shared Form fields look the same. Inputs, textareas and the Form component were otherwise already consistent, so no markup changed.

## Author dashboard
- Skeleton now includes list rows under the stat tiles; error state has a "Try again" button; an author with nothing submitted sees a one-line prompt with a Submit research button.
