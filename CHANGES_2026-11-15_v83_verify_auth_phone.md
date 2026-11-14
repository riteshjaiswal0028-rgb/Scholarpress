# v83: first real verification of v82 (auth + phone)
- Ran in this sandbox (network available): `npm install` (note: `npm ci` FAILS, package-lock.json is out of sync with package.json: ajv, @emnapi, fast-uri; run `npm install` once and commit the lock), `tsc --noEmit`, `vitest run`, `vite build`.
- Results: vitest 42 files / 481 tests pass (phone.test.ts 5/5). vite build OK. tsc had 2 errors, both in `components/pull-to-refresh.tsx` (touches[0] possibly undefined; not from v82); fixed with optional chaining, tsc now clean.
- package-lock.json left unchanged.
- NOT done: nothing opened in a browser, migration 0055 not applied to a real database. Still to do by you: apply 0055, then view /auth at 390px (both tabs, light and dark), sign up by email, sign in with Google and confirm the pop-up asks phone.
