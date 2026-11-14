# Scholarly redesign: Phase 0 and Phase 1 handoff

## Status
- Phase 0 (audit, baseline): done.
- Phase 1 (design tokens, type system): done, build passes.
- Phase 2 (shared components): DONE except notification centre. Done: button, input, textarea, card, table, shadow scale, overlays (dialog, alert-dialog, sheet, menus, popover, hover-card), select, tabs, toasts, checkbox/radio/switch, breadcrumb primitive (mono, flat), header on layout tokens (`--header-h`, smaller seal, flat account chip), and a new phone bottom nav (`src/components/mobile-nav.tsx`, mounted in `_authenticated/route.tsx`, hidden on /submit and /auth and while a field is focused, role-filtered via `useVisibleLinks`).
- NOT done in Phase 2: notification centre (no notifications table or API exists; needs a data-model decision), sidebar shell (shadcn sidebar exists but no route uses it; desktop keeps the top header + account menu), article route still uses its own inline breadcrumb markup, search icon still hidden in the native app.
- Phase 3 (public site): STARTED, first pass only. Done: home and article header/abstract flattened (no gradients, glow or top bar; radii rounded-lg; abstract in Source Serif at --reading-w), shared `.surface` (card bg, radius-lg, no hover lift), search field focus ring. Not done: per-route audit notes, explore, about, fees, editorial-board, policies, verify, paper, auth, article body/sidebar content, promo banners, empty/error states, mobile layout review.
- Phases 4-12: NOT started.

## Baseline (before and after Phase 1)
- `vite build`: passes.
- `vitest`: 463 pass, 3 fail. Failures are unrelated to styling: native deep-link test, migration-journal test (58 vs 60 files), referral-domain test.
- `tsc --noEmit`: 5 errors, all pre-existing (`upload-progress.tsx`, `submit.tsx`).
- Not tested: runtime behaviour of any route, auth, payments, certificates, PDFs, mobile layouts. Visual output has not been viewed.

## Files changed (Phase 2 adds: button.tsx, input.tsx, textarea.tsx, card.tsx, table.tsx, site-header.tsx)
- `src/styles.css`: Porcelain and Obsidian tokens, layout tokens, font tokens.
- `src/routes/__root.tsx`: Google Fonts link adds Geist, Geist Mono, Source Serif 4.
- `src/components/ui/badge.tsx`, `src/lib/ui.tsx`: new "review" badge tone for under-review statuses.
- `src/lib/domain/site-meta.ts`, `public/site.webmanifest`: theme colour = Porcelain.

## Deliberate deviations from the spec (accessibility)
- Muted text uses #62655e, not #74766f (spec value is ~4.1:1 on Porcelain, below AA). #92938c kept as `--faint` for non-essential metadata.
- Warning text uses #7f5b1d (deeper step of #a77b36) so badge labels reach AA.

## Type system
- UI: Geist (fallback Public Sans). Headings: Lora (bundled). Reading and articles: Source Serif 4 (`--font-reading`). Metadata: Geist Mono (`--font-mono`).
- Fonts load from Google Fonts like the existing setup. Offline/Android falls back to system fonts, same as before.

## Layout tokens
`--header-h` 3.5rem, `--sidebar-w` 15rem, `--content-w` 72rem, `--reading-w` 68ch.

## Route inventory (38 files in src/routes)
Public: index, about, explore, fees, editorial-board, policies.index, policies.$slug, article.$scholarpressId (+ .pdf), paper.$publicId, verify, verify_.$certId, verify_.certificate.$certId, auth, r.$code, robots.txt, sitemap.xml.
Authenticated (guarded by `_authenticated/route.tsx`): dashboard, submit, my-research.index, my-research.$id, manuscript.$paperId, reviews, certificates, profile, dues, founder, admin, orcid.callback, zenodo.callback.
API (no UI): api/public/health, client-error, mail/process, payments/razorpay-webhook, publish/process.
Per-route roles, data dependencies and responsive notes are NOT yet recorded.

## Not yet done
P0: Phase 2 shell and shared components; per-route audit. P1: public site, author workspace, submission flow, editorial, reviewer, article reader. P2: certificate and PDF layout, admin. P3: responsive pass, accessibility audit, performance, full regression run.
Known hard-coded colours remaining: maintenance.tsx, master-pause.tsx, upload-progress.tsx (amber/emerald). Android launcher icon background still navy.

## Phase 2 session checks
- v30: `vite build` passes; `tsc` = same 5 pre-existing errors; `vitest` 463 pass / 3 fail (same 3 as baseline). Visual output and real-device behaviour NOT viewed.
- Unverified risks: bottom nav on Android (viewport has no `viewport-fit=cover`, so safe-area inset is 0 there), pages with their own fixed bottom elements other than /submit, header height change 4rem to 3.5rem.
- Next: decide notification centre scope; then Phase 3 (public site), starting with a per-route audit.

## Phase 3 session check (v31)
- `vite build` passes; `tsc` same 5 pre-existing errors; `vitest` 463 pass / 3 fail (baseline). No browser available in the sandbox, so NOTHING was viewed. Changes are class and CSS edits chosen from reading the code.
- Next: open each public route in a browser, record roles/data/responsive notes, then restyle remaining public routes.

## App-wide flatten pass (v32)
- All `rounded-2xl`/`rounded-xl` in routes and components (outside ui/) became `rounded-lg` (20+29 hits, 11 files incl. admin, reviews, manuscript, referral, dues prompt, full-text).
- Hard-coded amber/emerald/sky removed: maintenance banner, master pause, upload progress now use caution/positive/primary tokens; upload progress gradients and glow removed. Zero amber/emerald classes remain in src outside ui/.
- Explore: native selects use card surface, 15px text and focus ring; checkbox uses accent-primary.
- Checks: build passes, tsc same 5 pre-existing errors, vitest 463/3 (baseline). NOT viewed in a browser.
- Still open: per-route audit notes, visual review of every route, certificate/PDF layout (Phase P2, immutable issued PDFs), Android launcher icon background still navy, notification centre, sidebar shell.

## v33 session: palette aligned to the final brief
- `src/styles.css` light/dark tokens now use the brief's exact Editorial Ivory / Scholar Graphite values (background, surfaces, text, border, brand, accent, gold/warm neutral, status colours, chart colours, sidebar). THEME_COLOR and webmanifest theme_color = #f7f7f4.
- Kept AA deviations: warning text stays #7f5b1d (brief #A97B35 is ~3.6:1 on its soft fill); #858b85 muted is used as `--faint` only, body-muted text uses #666d68.
- Brand rename Velnora -> Scholarly done across code, files, package id (com.scholarpress.admin) and DB column scholarpress_id (live DB needs a rename migration).
- Not done: Instrument Serif / DM Serif Display (single-weight faces; headings still Lora, needs a heading-weight audit first), phases 4-12, visual review. No node_modules/network in this sandbox, so build/tsc/vitest were NOT run this session; run `bun install && vite build && vitest run` first.
- Next: run the build, then Phase 3 route audit and Phase 4 journal discovery (explore.tsx).

## v34 session: Phase 4 first pass (discovery list)
- Finding: this app has no journal entity (record types are repository record / preprint / journal article), so no journal directory, covers or comparison were invented. Journal-style discovery lives in /explore.
- `article-row.tsx`: card replaced by a flat editorial list entry (divider, hover wash, mono uppercase metadata). Used on home (limit 8) and /explore.
- `explore.tsx`: content width token, two-column layout at lg with a sticky "Refine" filter column (same filters, same search params), results column with mono count line. Mobile stacks filters above results.
- Checks: NOT built or viewed (no node_modules/network). JSX div balance checked by count only.
- Next: run build/tsc/vitest; then per-route audit and restyle about, fees, editorial-board, policies, verify, auth; then article body/sidebar (Phase 5).

## v35 session: Phase 3 public pages, second pass
- `styles.css`: new helpers `.eyebrow` (mono uppercase label), `.section-rule`, `.meta-list` (ruled label/value rows, stacks on phones).
- `PageTitle` (`lib/ui.tsx`) takes optional `eyebrow`; set on explore, about, fees, editorial-board, policies (index + slug), verify.
- `about.tsx`: sections ruled, publication details use `.meta-list` (7 rows, tags balanced by count).
- `fees.tsx` still uses the old grid `dl` (rows contain multi-line content); convert next.
- Checks: NOT built or viewed (no node_modules/network). Run `bun install && vite build && tsc --noEmit && vitest run` first; baseline was build ok, 5 tsc errors, 463 pass / 3 fail.
- Next: fees dl, editorial-board and policies body styling, auth page, home sections, then Phase 5 article reader.

## v36 session: Phase 3 public pages, third pass
- `fees.tsx`: old grid `dl` converted to `.meta-list` (9 rows, each dt+dd wrapped in a div by script; leftover check empty). Sections ruled.
- `editorial-board.tsx`: role sections ruled. `auth.tsx`: mono eyebrow above the heading; form untouched.
- No other `sm:grid-cols-[12rem_...]` dl grids remain in src.
- Checks: NOT built or viewed. Same first step as before: `bun install && vite build && tsc --noEmit && vitest run`.
- Next: home page sections (hero, workflow, FAQ if data exists), policies body, then Phase 5 article reader (`article.$scholarpressId.tsx`).

## v37 session: Phase 5 first pass (article page)
- `article.$scholarpressId.tsx`: boxed wash header -> flat header with bottom rule; journal line uses `.eyebrow`; type/field badges are square mono labels; abstract is an unboxed column at `--reading-w` with a serif heading; keywords are square chips; new "On this page" anchor row (Abstract, Full text, Cite, Versions; all four targets always render); sidebar is a top-ruled panel instead of a rounded card.
- `full-text.tsx`: "Read online" eyebrow uses `.eyebrow` (gold rule removed).
- Data, PDF/stamped download, citation export, notices, retraction banners untouched.
- NOT built or viewed. Not done on this page: section nav for article body headings (depends on FullText content), figures/tables/equations styling, share/copy-DOI actions (check existing `doi-link.tsx` first), related articles (no data source found).
- Next: build check, home sections, policies body, then Phase 6 author portal (dashboard, my-research, submit).

## v38 session: Phase 6 first pass (author portal)
- `dashboard.tsx`: stat tiles are now flat left-ruled figures (serif numerals, mono labels, hover/focus rule in primary); zero values use full muted text colour (was /60, below AA); eyebrow "Overview"; grids use gap-x-4 gap-y-5. Links and data unchanged.
- `my-research.index.tsx`: eyebrow "Author", table header in mono uppercase. It was already a table.
- NOT built or viewed. Not touched: `my-research.$id.tsx` (manuscript tracking), `submit.tsx` (multi-step form, validation, autosave), notifications (no data model), profile, certificates.
- Next: build check; read `submit.tsx` fully before restyling (keep every field, validation, upload logic); then Phase 7/8 (editorial, reviews).

## v39 session: Phase 6 second pass (submit stepper)
- `submit.tsx` presentation only: eyebrow shows "Step N of 4" (uses existing `step`/`STEPS`); step markers are square mono tiles, glow shadow replaced by a 1px ring on the current step; upload drop zone dashed border 2px -> 1px, rounded-md. No field, validation, autosave, upload or state logic touched.
- `my-research.$id.tsx` reviewed: sections already ruled with serif h2s; left as is. Not added: manuscript ID eyebrow (field name unverified).
- NOT built or viewed.
- Next: build check; Phase 7 editorial (`_authenticated/admin.tsx` editor/queue areas) and Phase 8 reviewer (`reviews.tsx`); read each fully first.

## v40 session: Phases 7/8/10 labels only
- Eyebrow labels added: reviews ("Reviewer"), certificates ("Author"), founder/payments ("Finance"), admin h1 ("Administration"). No logic touched.
- Not restyled: admin.tsx (818 lines: editor queue, assignments, decisions, roles, payments, certificates, emails, referrals, Zenodo) and reviews.tsx evaluation form. These carry permission and confidentiality rules; they need a full read plus a browser to restyle safely. Role-based nav (author/editor/reviewer sets) not changed: existing routes kept, `mobile-nav.tsx` and `site-header.tsx` already filter by role.
- NOT built or viewed.
- Next: build check, then read admin.tsx tab by tab and convert card lists to compact tables only where the data is row-shaped.

## v41 session: Phase 10 first pass (admin shell)
- `admin.tsx` presentation only: status-count strip is now ruled (no box), serif figures, mono labels; section sub-tabs changed from pills to underline tabs (active = primary border/text; count badge always filled so it stays legible); same buttons, handlers, `aria-current`, permissions, hash routing.
- Admin already used tables (`rtable`) and ruled sections; panels (review, peer review, fees, promo, refunds, payments, audit) untouched.
- NOT built or viewed. Check the sub-tab row wraps cleanly at 360px and the count badge contrast.
- Next: build check; reviewer evaluation form (`reviews.tsx`), `Review` panel (admin.tsx line ~314), then Phase 9 certificate/PDF templates (`lib/domain/certificate-pdf.ts`, `certificate-layout.ts`, immutable for already-issued PDFs).

## v42 session: Phase 8 first pass (reviewer) and control shapes
- `reviews.tsx`: 3 pill shapes (accept/decline buttons, recommendation buttons, submit) now rounded-md; invitation metadata line in mono uppercase. Review logic, COI radios, comment fields, confidentiality copy untouched.
- `full-text.tsx` (view tabs, text-size group, PDF link) and `trust-strip.tsx`: rounded-full -> rounded-md. Avatars, progress bars, referral and role chips left as is.
- NOT built or viewed.
- Next: build check; editor `Review` panel (admin.tsx ~314) after reading it fully; Phase 9 certificate/PDF layouts; Phase 11 mobile check at 360px (admin tab row, stat grids, article nav row); Phase 12 a11y + regression notes. Still missing from the brief and NOT built: notification centre (no data model), journal directory (no journal entity), related articles, Copy DOI/share actions.

## v43 session: brand assets and certificate template (Phases 1 and 9)
- Found: seal, icons, favicons, OG image, Android icons/splash and `logo-resources.ts` still carried the old navy "V" mark; certificate template JPG carried Paperly branding ("PAPERLY ID", "Paperly Team" signature, crimson ribbon, tagline).
- `scripts/generate-brand-assets.py`: new mark = Lora Bold "S" with a gold base bar on forest green (#263D32), ivory #F7F7F4, antique gold; regenerated public/ seal (512, hd), icon-192/512, apple-touch, favicons, og-image, horizontal logo, Android mipmaps and splash; `ic_launcher_background` = #263D32. Seal viewed and looks right; the other outputs were NOT viewed.
- `src/assets/logo-resources.ts`: `logoPngBase64` now the new seal (800px), used at the top of certificate PDFs.
- New `scripts/generate-certificate-template.py`: ivory 1536x1024 template with forest outer frame, antique-gold inner rule and corners, "This certifies that" header, recipient rule, "CERTIFICATE ID / Scholarly ID / ISSUE DATE" labels, "SCAN TO VERIFY", footer ornament. No signature, ribbon, tagline or slogan. Writes `certificate-template.jpg` and `certificate-resources.ts` `backgroundBase64`. Template viewed once (before the watermark was swapped for faint rings; final version NOT viewed).
- `certificate-layout.ts`: INK #263d32, GOLD #8a6a2c, QR ink #1b2a22, SLATE/MUTED neutral greys. Coordinates unchanged. Certificate copy still says "Scholarly International Journal of Medical Innovation" (existing text; confirm it is correct).
- Issuance rules, verification, PDF generation code untouched. Already-issued PDFs are unchanged; only newly generated ones use the new look.
- NOT done/verified: a rendered sample of each certificate type (SUBMISSION, PUBLICATION, PEER_REVIEW, AUTHOR_RECORD) with long names/titles; `certificate-pdf.test.ts` not run; `capacitor.config` splash/status-bar colours not checked; `public/site.webmanifest` icons fine.
- Next: run build + tests, render the four certificates and look, then Phase 11 phone-width pass and Phase 12 regression notes.

## v53 session: brief reset, Phase 0 + Phase 1 (design system)
- Phase 0 baseline (run, not assumed): build passes; tsc 5 pre-existing errors; vitest 464 pass / 2 fail (native deep-link, migration journal). Chromium/Playwright works in the sandbox; authenticated routes cannot render without Supabase credentials.
- The 2026-11-13 "premium redesign" (gold/crimson, Cormorant, marquee, floating seal, pill buttons) is superseded by the new brief.
- `styles.css`: tokens now the brief's palette (light + dark) plus secondary-brand, success/warning/info aliases, focus, disabled. AA deviations: muted text #5e6862 (brief #69736D fails on secondary surface), control border --input #7d877f / dark #76867b (3:1), gold-ink #6f5a2b for text. Radii max 12px. All `pm-*` classes kept for markup compatibility but flattened: no gradients, blur, lifts, marquee, float/spin/pulse, scroll reveal, hero-seq. `.pm-bands`, `.pm-hero-seal`, `.pm-marquee` are display:none until Phase 2 removes their markup. Headline word-run-together bug fixed.
- Fonts: UI Inter, serif Source Serif 4 (Google link trimmed to 400/600/700; Literata and Geist sans removed), mono Geist Mono. Lora/Cormorant/Playfair @font-face kept ONLY for certificate-view.tsx preview (revisit in Phase 7).
- Components: button (rounded-md, h-11, flat, disabled tokens), input (46px), textarea, badge (rounded-md), sheet (200ms), CountUp (static), Razorpay theme colour = brand green.
- Checks after: build ok, tsc same 5, vitest same 464/2. Viewed light+dark at 360 and 1280 on /, /auth, /fees, /explore: no horizontal overflow. Source Serif did not load in the sandbox (no network), so serif renders as a Times fallback in screenshots.
- Known / next (Phase 2): home markup still has hardcoded hex (index.tsx CTA), gradient rule under hero headline, seal on dark theme is low contrast, footer/header not yet redesigned, promo banner themes (admin-selectable) left as is, tables/select/tabs/dialog not yet audited at component level.

## v54 session: Phase 2 (public homepage, header, footer)
- `routes/index.tsx` rebuilt: plain hero (journal name line, single-colour headline, search, submit/browse actions) with a ruled "Submitting" panel (fee from the existing getPublicFees query, payment, file limit, human decision); then Recently published (same query/ArticleRow), How a submission is handled (existing 4 steps), Editorial and peer review (existing 3 statements), Author resources and journal information (links to existing routes only), and a flat call to action. Removed: marquee, floating seal, bands, word-by-word reveal, gradient rule, hardcoded hex, pillar cards with icons. No statistics were shown before and none were invented.
- `site-header.tsx`: seal gets a light tile in dark mode (was low contrast), account chip and avatar are rounded-md, footer is a flat secondary-surface block with sentence-case column headings and a small seal; link hover uses primary, not gold.
- `PageTitle` (`lib/ui.tsx`): no gradient rule or entrance animation; uses `--text-page`. Tailwind note: size tokens need `text-[length:var(--text-...)]`, plain `text-[var(--x)]` is read as a colour.
- `scroll-reveal.tsx` deleted and unmounted from `__root.tsx` (its CSS was removed in Phase 1). `ArticleRow`, trust strip and full-text ornament no longer use gold text.
- Checks: build ok; tsc same 5; vitest 464/2 (baseline). Viewed home light 1280 and dark 390 full page; /, /about, /fees at 360 and 1280 in both themes: no horizontal overflow. Recent articles stayed in the loading skeleton in the sandbox (no backend), so real article rows were not viewed. Serif is a fallback face here (no network for Source Serif 4).
- Next: Phase 3 author dashboard and submission experience (needs real data to view; run locally with Supabase env).

## v55 session: mockup UI pass
- Pill buttons/search, card rows, rounded bottom nav, home layout (kicker, pillar icon row, numbered process), My research cards on phones, round labelled submit stepper, article chips/tabs. Presentation only; see CHANGES_2026-11-14_mockup_ui_pass.md. NOT built or viewed (no node_modules). Next: build, then view at 390px.

## v56 session: Android redesign pass (brief palette, home featured/subjects, explore filter sheet, my-research filters, 5-step submit, sticky article tabs). NOT built or viewed. See CHANGES_2026-11-14_android_redesign_pass.md.

## v57: reader typography, viewport-fit=cover + header safe-area, landscape tweaks. NOT built or viewed. See CHANGES_2026-11-14_reader_safe_area.md.

## v58: bottom nav until lg (tablet gap), 48px dialog/sheet close. NOT built or viewed.

## v75: profile screen (loading, error, account block)
- `routes/_authenticated/profile.tsx`: eyebrow "Account"; read-only Account block (name, email from the existing `meQuery`, shown only if present); ORCID section now has a skeleton while loading, an error alert with "Try again" if the ORCID status fails (before, a failed load left the section empty), and a "Verified" badge on the verified line. ORCID connect flow, copy and sandbox notice unchanged. No new data, no editing of name/email.
- Reviewed v74 dashboard changes in code (skeleton rows, error + retry, new-author prompt): present and wired to existing data. Small leftovers: skeleton tiles use `rounded-2xl` and the new-author prompt `rounded-xl` (the flatten pass uses `rounded-lg`).
- Checks: syntax only (brace balance). No node_modules and no network in this sandbox, so tsc, vitest, `vite build` were NOT run and nothing was opened in a browser. Run `npm i && npm run build && npm run typecheck` first, then open /dashboard and /profile at 390px.
- Next: certificates screen, then the file upload area on /submit.

## v76: certificates list states
- `components/certificate-delivery.tsx` (used by /certificates and the per-paper view): loading skeleton (title, certificate frame, button) instead of a text line; error is now an alert row with "Try again" (shows a spinner while refetching); empty state on /certificates uses the shared `EmptyState` (Award icon, "No certificates yet", "View my research"). The per-paper view keeps its one-line "No certificate has been issued for this work." Certificate rendering, QR, download and verify links untouched.
- Checks: syntax only (brace balance). No node_modules/network, so tsc, vitest, vite build NOT run; nothing viewed. Run `npm i && npm run build && npm run typecheck`, then open /certificates with and without issued certificates.
- Next: file upload area on /submit (read `submit.tsx` and `upload-progress.tsx` fully first; keep validation, autosave, upload logic).

## v77: submit page upload area (step 1)
- `submit.tsx`, presentation only: the manuscript drop zone highlights while a file is dragged over it (new `dragOver` state, UI only); the chosen-file icon is neutral (was red, which read as an error); an upload error now shows its row even for files under 1 MB (before, small-file errors were invisible; the row only rendered above 1 MB); the anonymized-copy field uses the same pattern as the manuscript (hidden input, "Choose anonymized copy" button, file name and size, "No file chosen"). `pick`, `stageFile`, validation, autosave, AI-suggest and submit logic untouched.
- Not added: a "Remove file" action (would touch `forgetFile`/staging, needs a read of `stage-upload.ts` first). `upload-progress.tsx` still has the moving sheen and `shadow-soft`; left as is.
- Checks: syntax only (brace balance). No node_modules/network: tsc, vitest, vite build NOT run; nothing viewed. Run `npm i && npm run build && npm run typecheck`, then on /submit try: drag a file over, pick a file under 1 MB while offline (error row should show), pick an anonymized copy.
- Next: build and phone-width check of dashboard, profile, certificates, submit step 1; then Remove-file action; then Phase 12 regression notes.

## v78: Remove file on /submit step 1
- `submit.tsx`: an X button on the chosen manuscript row and a "Remove" button next to the anonymized copy. Both call the existing `pick(which, null)` (clears file, progress and error) and reset the hidden input so the same file can be chosen again; both are disabled while `busy` (submitting). `stage-upload.ts` untouched.
- Known, pre-existing: an upload already in flight for a removed (or replaced) file keeps running and its progress listener can still call `setUpPct` for that slot; a staged copy of an abandoned file is not deleted from storage by the client. Check whether the server cleans up unreferenced staged files before relying on this.
- Checks: syntax only (brace balance). tsc, vitest, vite build NOT run; nothing viewed. On /submit: choose a file, remove it, choose the same file again (should upload again), press Continue with none chosen (should show the "Attach your manuscript" error).
- Next: your build + 390px pass over dashboard, profile, certificates, submit step 1; then Phase 12 regression notes.

## v79: regression checklist
- New `docs/REGRESSION_CHECKLIST.md` lists what to open and expect for the v74 to v78 changes (dashboard, profile, certificates, submit step 1) and the baseline to compare against.
- Static check done this session (the only check possible without node_modules/network): every `@/` import in dashboard.tsx, profile.tsx, certificate-delivery.tsx and submit.tsx resolves to a file and the imported names are exported; no unused named imports; brace balance 0. This is NOT a type check.
- Still NOT run: tsc, vitest, vite build; nothing viewed.
- Next: run the checklist after a build; then remaining phases (editor `Review` panel in admin.tsx, certificate PDF samples).

## v80: editor Review panel (admin.tsx, `Review`)
- If the screening report request fails, the panel now shows an alert with "Try again" (before: skeleton forever). Reason chips have `aria-pressed`, a highlighted selected state and a 40px minimum height; the reason textarea has an aria-label; finding names replace every underscore (was only the first). Decision logic, permissions, publish flow, PeerReviewPanel, AdminSkipReview, delete and referral panels untouched.
- Not changed, for your decision: every verdict button (including Disapprove and Approve) acts on one tap with no confirmation. That matches the "tap a reason, then a verdict" design, but a mistaken tap on a phone sends the author an email-visible decision. A confirm step for Disapprove (and maybe Approve) is a small change if you want it.
- Checks: syntax only (brace balance); `Button`, `Skeleton` already imported. tsc, vitest, vite build NOT run; nothing viewed. Add to the checklist: open a paper in /admin (block `adminPaperReport` to see the error state), tap a chip (highlight, text fills), tap another (replaces).
- Next: your build and checklist run; then certificate PDF samples for the four types.

## v81: one certificate per author, Author type only (no Submission certificate)
- Request: "one certificate, authors only, multiple authors supported"; answer to my question: one certificate per author, Author type only, no Submission certificate. Reviewer (Peer Review) certificates were not mentioned and are unchanged.
- Finding (code read): the live flow already issues exactly one certificate per listed author when a paper is published (`issueOwnerPublicationCertificate` for the uploader, `issueAuthorCertificates` for every other author, type PUBLICATION, one per author, holds and e-mail bundle per author). The ONLY place that still created a SUBMISSION certificate was the admin Test certificate button (`adminRunTestCertificate`).
- Change: that button now issues AUTHOR_RECORD (needs no publication) instead of SUBMISSION. Nothing in the app issues SUBMISSION any more.
- Deliberately NOT changed: the `SUBMISSION`/`AUTHOR_RECORD` types, titles, copy and layout stay, because already-issued certificates are immutable, must keep verifying and keep rendering online exactly like their stored PDFs; no DB enum or migration touched. Authors still see "Certificate of Publication" (the type every published author gets).
- Open question for you: is the single author certificate meant to be titled differently (for example "Certificate of Authorship")? That is a template and copy change for NEW certificates only and needs the layout checked in a render.
- Checks: syntax only; one-line type change. tsc, vitest, vite build NOT run. `certificate-pdf.test.ts` and `reviewer-scholar.test.ts` loop over all types and are unaffected by this edit, but run them.
- Next: your build + checklist; then render the Publication and Author Record certificates with 1 and 5 authors' worth of long names/titles.

## v82: sign in / sign up page, phone number with country selector
- **Apply `drizzle/migrations/0055_profile_phone.sql` BEFORE deploying this build** (adds nullable `profiles.phone` E.164 and `profiles.phone_country`; journal entry added; same visibility as the rest of the profile). Without it new-account creation and the details pop-up fail on the unknown column.
- `routes/auth.tsx` rebuilt on the current UI: segmented "Sign in | Create account" tabs (hidden inside the Android app as before), Google first (label changes per tab, with a note that Google users are asked age and phone afterwards), eyebrow style, inline field errors (`aria-invalid`/`aria-describedby`, focus moves to the first error), show/hide password, valid-email check. Sign-up order: full name + age, email, phone (country selector + number), password (min 8). Sign-in: email, password. Referral `?join=1`, error-param handling, session redirect, native Google flow unchanged. No "Forgot password" yet: there is no reset route in the app.
- `components/phone-field.tsx` (new, shared): native `<select>` (system picker on phones) with "Common" group first (India, Kyrgyzstan, Uzbekistan, Kazakhstan, Pakistan) then "All countries" A to Z (200 countries, dial code beside the name), dial-code prefix in the number box.
- `lib/domain/phone.ts` (new) + `phone.test.ts`: country list, `cleanPhone(country, input)` -> E.164. Exact lengths for IN 10, PK 10, KZ 10, RU 10, UZ 9, KG 9 (a leading 0, 8 or the country code is tolerated); others 6 to 14 digits; rejects letters, repeated digits, wrong "+" code.
- Server: `getMe` stores the sign-up phone (read from user metadata `phone_country`, `phone_national`, re-validated) and only marks the profile completed when name, age AND phone are valid; `completeProfile` now requires `phone_country` + `phone`. `ProfileDetailsGate` (the pop-up for Google and incomplete accounts) asks name, age and phone. Existing accounts are NOT asked: their `details_completed` is untouched and `phone` stays null.
- Known gaps: the phone is stored but not verified (no SMS/OTP) and not shown on /profile; admin screens do not display it; Supabase `types.ts` was edited by hand for the two columns (regenerate when convenient).
- Checks: syntax only (brace balance, journal matches files on disk, 200 unique ISO codes, phone cases traced by hand). tsc, vitest (new `phone.test.ts` included), vite build NOT run; nothing viewed.
- Next: apply 0055, run build + tests, view /auth at 390px (both tabs, light and dark), sign up with email, sign in with Google and check the pop-up asks phone.

## v84: forgot password by email code
- See CHANGES_2026-11-15_v84_forgot_password.md. Needs the Supabase Reset Password email template to include {{ .Token }} and the redirect URL allow-listed. tsc, vitest, vite build pass; not viewed in a browser.
