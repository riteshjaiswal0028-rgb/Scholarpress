# Scholarly: Design System 2.0 audit (v74)

Method: read of the code only. NOT measured: tsc, tests, production build, Lighthouse (LCP/INP/CLS) and browser screenshots were impossible here (no node_modules, no network, no browser). Nothing below claims a measured result.

## What already meets the brief
- Tokens: semantic CSS variables for background, card, primary, muted, border, ring, positive/caution/review/critical, radii, type scale (`--text-display/page/article/section`), easing (`--ease-premium`, `--ease-settle`). Dark mode uses the same token names.
- Fonts: Inter, Source Serif 4, Geist Mono, self-hosted variable woff2, `font-display: swap`.
- Button: variants (default, destructive, positive, outline, secondary, soft, ghost, link), sizes, `loading` that keeps width, focus ring via token.
- Motion: reduced-motion rules in 11 places, global fallback; skeleton, empty and error states exist on the main lists.
- Article page: reading width variable, serif body at 1.125rem / 1.75.

## Inconsistencies and issues found
1. Hard-coded colours outside tokens: promo-banner.tsx (17), banner-admin.tsx (4), index.tsx hero book SVG (2), auth.tsx Google logo (brand colours, fine), dues.tsx Razorpay theme (#23483b, must be a literal for the third party). I added three more in v74 and removed them again (now `dark:bg-foreground`).
2. Header logo was an old book SVG, not the round seal (fixed in v74).
3. No font preload: first paint waited on CSS then fonts (fixed in v74: Inter and Source Serif 4 preloaded in `__root.tsx`).
4. Unused `@font-face` blocks (Lora, Cormorant Garamond, Playfair Display, 7-ish files). They cost nothing unless used, but confirm they are only for PDF/certificates before deleting.
5. Buttons are fully pill-shaped everywhere. The brief asks for restraint with pills; a `rounded-md` option for dense admin tables is worth considering. Not changed, since it is a brand decision.
6. Radii tokens `xl` to `4xl` all resolve to the same value, so they are redundant.
7. Explore had a blocking loader and no skeleton (fixed). Pull-to-refresh, unread badge, active filter chips and shared empty state added.

## Not done in this pass (needs a runnable environment or your decision)
- Reviewer, editorial and admin page-by-page polish: audit them with screenshots first.
- Replace the promo/banner hex colours with tokens (needs a look at how banner colours are user-configurable in admin; they may be intentional per-banner choices).
- Measure LCP/INP/CLS, run axe contrast checks, test on a real Android device.
