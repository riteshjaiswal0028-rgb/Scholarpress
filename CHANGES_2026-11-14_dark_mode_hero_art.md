# v63: system-based dark mode and home hero artwork
Dark mode (follows the device; there is no switch)
- `src/lib/theme.ts`: a small script in <head> adds or removes the `dark` class on <html> from `prefers-color-scheme` before first paint, and live when the setting changes. The existing `.dark` palette in styles.css is now used. Added `color-scheme` meta and CSS, and a `theme-color` meta that updates with the theme.
- `native-bridge.tsx`: inside the Android app the status bar style and colour follow the same setting (@capacitor/status-bar, already a dependency).
- Android: `drawable-night*/splash.png` added for every splash density, dark background with the seal on a cream rounded tile.
- Not checked: the Capacitor WebView reporting `prefers-color-scheme` on a real device (it should, from the system night mode). Admin pages, the editor and the payment widgets were not reviewed in dark. The Capacitor `backgroundColor` is still the light ivory, so a very brief light frame is possible before the page paints on a dark phone.

Home hero image
- The small book stack is replaced by larger artwork: two journal volumes in front of soft arches, in the brand greens with gold details, drawn in SVG from theme tokens so it works in light and dark. On phones it sits under the buttons and bleeds to the right edge; on large screens it fills the right column. Rendered separately and checked in both themes, but not placed in the live page.
- This is an illustration, not a photograph. A real photo needs an image file from you.

Checks run: tsc 0 errors, vitest 466/466, vite build ok. Not viewed in the app, no device.

## v64 follow-up
- Dark-mode scan: the only hard-coded light colours are the promo banners (they carry their own backgrounds) and the new hero artwork (deliberate). Nothing else needs a dark variant.
- Fixed a duplicate: the site already emitted a `theme-color` meta, and v63 added a second one. Removed mine; the boot script now updates every `theme-color` meta with the theme.
- Checks run: tsc 0 errors, vitest 466/466, vite build ok.
