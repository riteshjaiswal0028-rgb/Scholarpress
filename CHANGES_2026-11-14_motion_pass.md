# v65: smoother UI and motion
Already in place and kept: page-enter on every route, `stagger` helper, easing tokens, link/button/search-field transitions, loading bar, skeleton shimmer, sheet and dialog animations, a global reduced-motion override. Cross-fade page transitions stay OFF on purpose (they held clicks back).

Added (all inside `prefers-reduced-motion: no-preference`, so reduced-motion users see none of it):
- Touch feedback: buttons and chips dip to 97% while pressed and spring back (checkboxes, switches, comboboxes, menu items and options excluded).
- Bottom nav: the bar under the current tab grows in and the old one shrinks out; the active icon lifts; icons dip when pressed.
- Scroll reveal: home sections fade and rise as they enter the viewport, using CSS scroll timelines (`animation-timeline: view()`, no JavaScript). Browsers without support just show the sections.
- Staggered entrance: home hero text, the home "Recently published" list, Explore results and the My research cards (mobile) settle in one after another.
- Hero artwork drifts up and down by 7px over 7 seconds.

Not done: haptic feedback (needs a new native plugin and `cap sync`), shared-element transitions between a list row and its article, swipe gestures, pull to refresh.
Checks run: tsc 0 errors, vitest 466/466, vite build ok; the new CSS is in the built stylesheet. NOT seen running: no browser or device here, so timings and feel need a look on a phone.
