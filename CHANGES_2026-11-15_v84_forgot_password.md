# v84: Forgot password / set a password by email, with code verification
- `/auth`: sign-in has a "Forgot password?" link. New `components/password-reset.tsx`, 3 steps: (1) email, (2) code from the email, (3) new password + repeat. The page never says whether an account exists. Resend has a 60 s cooldown. Saving a password signs other devices out (`signOut({scope:"others"})`, best effort). Works for Google-only accounts too (adds a password after the email proves ownership). Both the code and the emailed link work; the link opens `/auth?reset=1` straight on step 3 (the signed-in redirect is skipped for that URL).
- `lib/domain/password.ts` + `password.test.ts`: code cleaning, 8 to 72 character rule (bcrypt ignores the rest), repeat must match.
- Uses Supabase Auth only (`resetPasswordForEmail`, `verifyOtp` type `recovery`, `updateUser`); no server route, no migration.

## Required Supabase setup (dashboard, not in this repo)
1. Authentication > Email Templates > "Reset Password": the body must show the code, for example:
   `<h2>Reset your Scholarly password</h2><p>Your code: <strong>{{ .Token }}</strong></p><p>Or <a href="{{ .ConfirmationURL }}">open this link</a>. If you did not ask for this, ignore this email.</p>`
   Without `{{ .Token }}` people get only the link and step 2 has nothing to type.
2. Authentication > URL Configuration: add `<your site>/auth` (and `/auth?reset=1`) to Redirect URLs, else the link is rejected.
3. Email sending: the built-in Supabase mailer is heavily rate limited; set custom SMTP for real use.
4. Optional: Authentication > Providers > Email > OTP length / expiry (the page accepts 6 to 10 digits).

## Checks run
tsc clean, vitest all pass (incl. new tests), vite build OK. NOT done: nothing opened in a browser and no real email sent. Test: Forgot password > email > code > new password > signed in; a wrong code; resend after 60 s; the emailed link; a Google-only account.
In the Android app the emailed link opens in the phone browser (no app deep link for it), so the code is the path that stays inside the app.
