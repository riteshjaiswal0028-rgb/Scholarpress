# Mockup UI pass (v55)
Presentation only. No routes, queries, handlers, validation, permissions or copy of existing sections changed. Colours: no new colours or token values; every colour comes from existing tokens.

- Buttons: pill shape app-wide (`ui/button.tsx`). Search field: pill with soft shadow, placeholder "Search articles, authors, or keywords…".
- Home: gold-rule kicker, larger serif headline, soft accent circle behind the hero, "Submitting" facts in a rounded secondary panel, a three-icon row built from the existing pillar titles, gold-rule section titles, numbered process line (existing 4 steps; vertical on phones, horizontal on lg).
- Article rows (home, explore): rounded card entries, 2-line abstract.
- Mobile bottom nav: rounded top, soft shadow, active marker under the tab, heavier active icon. Same links and role filtering.
- Header wordmark: mixed-case serif (was spaced capitals).
- My research: card list below md, table unchanged from md up. New "+" icon on the submit button.
- Submit stepper: round numbered steps with labels beneath, solid primary line. Step logic unchanged.
- Article page: pill type/field/keyword chips; "On this page" row styled as underline tabs (same anchors).

Not added because the app has no data or feature for it: invented stats (12K+ / 8K+ / 150+), hero photography, bookmark, notifications tab, status filter chips on My research, filter sheet on search, hamburger menu, subject thumbnails.
Checks: NOT built or viewed (no node_modules or network in this sandbox). Brace/paren/list balance checked by script. First step next time: `bun install && vite build && tsc --noEmit && vitest run`, then look at / , /explore, /my-research, /submit at 390px.
