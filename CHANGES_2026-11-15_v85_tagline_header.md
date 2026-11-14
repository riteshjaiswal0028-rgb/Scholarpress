# v85: "International Academic Publishing" moved to the header
- Removed the tagline (gold-rule kicker) from the home hero (`routes/index.tsx`); the headline now starts the hero.
- `components/site-header.tsx`: the tagline is now the second line under the seal and the "Scholarly" name, at every width. On desktop (lg) the journal line "International Journal of Medical Innovation" follows it after a dot, and it truncates if space runs out. Header height unchanged (3.5rem).
- Checks: tsc clean, vitest all pass, vite build OK. NOT viewed in a browser: check the header at 390px (the 32px name plus the line must fit in 56px) and at desktop width, light and dark.
