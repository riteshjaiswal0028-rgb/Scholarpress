# Regression checklist (v74 to v79 changes)

Run first: `npm i && npm run build && npm run typecheck && npm test`.
Baseline from earlier sessions: build ok; tsc 5 pre-existing errors (`upload-progress.tsx`, `submit.tsx`); vitest 464 pass / 2 fail (native deep link, migration journal). Any new tsc error in the files below is from v74 to v79.

Check each at 390px and 1280px, light and dark. Authenticated routes need Supabase env.

## /dashboard (v74)
- Loading: skeleton tiles plus 3 list rows; no layout jump when data arrives.
- Error (block the `myDashboard` request): alert with "Try again"; button spins while retrying and the page recovers.
- New author (no submissions, nothing published): prompt with "Submit research" linking to /submit. Not shown when either list has items.

## /profile (v75)
- Account block shows name and email only when present.
- ORCID: skeleton while loading; error alert + retry if `getMyOrcid` fails; "Verified" badge on a verified iD; connect button, unconfigured notice and sandbox note unchanged.

## /certificates and a paper's certificate list (v76)
- Skeleton while loading; error alert + retry; empty state on /certificates ("View my research"); one-line message on the per-paper view.
- With certificates: preview, QR, Download PDF, View online unchanged.

## /submit step 1 (v77, v78)
- Drag a file over the drop zone: highlight appears and clears on leave and drop.
- File under 1 MB with the upload blocked (offline): error row is visible.
- Remove (X) on the manuscript and "Remove" on the anonymized copy: clears the file, progress and error; choosing the same file again uploads again; both disabled while submitting.
- Continue with no file: "Attach your manuscript" error. Files over 50 MB or not PDF/docx still rejected.
- Whole flow: steps 2 to 5, payment redirect, AI suggest, autosave unchanged.

## Not covered
Real-device Android (safe areas, bottom nav), staged-upload cleanup on the server, certificate PDF samples for all four types.

## /admin editor Review panel (v80)
- Open a paper: report loads; block the report request: error alert + "Try again" recovers.
- Reason chips: tapping one fills the box and highlights it; tapping another replaces it. Verdict buttons, publish, peer review, skip review, delete unchanged.

## Certificates: one per author (v81)
- Publish a paper with 3 listed authors (one uploader): each gets exactly one PUBLICATION certificate; no SUBMISSION certificate exists for the paper.
- /admin Test mode, "Test certificate": issues an Author Record certificate and returns a download link (previously Submission).
- Existing Submission and Author Record certificates still open at /verify and download.

## /auth and the details pop-up (v82; apply migration 0055 first)
- 390px and 1280px, light and dark. Tabs switch without losing layout; sign-up fields in the order name+age, email, phone, password.
- Phone selector: India, Kyrgyzstan, Uzbekistan, Kazakhstan, Pakistan on top, all other countries below; dial code shows in the number box and changes with the country.
- Submit empty: inline errors on every field, focus on the first. Bad phone for the chosen country (for example 5 digits for India): phone error. Password under 8 characters: error.
- Email sign-up: confirm-email toast; after confirming and signing in, `profiles.phone`/`phone_country` are filled and the pop-up does NOT appear.
- Google sign-up: pop-up appears asking name, age and phone; saving fills them. Existing accounts do not see the pop-up.
- Sign-in with wrong password shows the server message in the red box; show/hide password works.
- Inside the Android app: no tabs, sign-in only, Google opens the phone browser as before.
