# v57: reader typography and safe areas
- `styles.css`: article body (`.fulltext`) now reads like a journal: reading serif at a comfortable size and line height, serif headings with a rule above sections, figures in a bordered frame with sans captions, brass-ruled quotes, tables that scroll sideways inside their own frame with a tinted header row.
- `__root.tsx`: viewport now has `viewport-fit=cover` so `env(safe-area-inset-*)` is reported where the platform supports it; `.site-header` adds the top inset. The bottom nav and submit bar already used the bottom inset. Check on a real Android device or emulator that the header does not sit too low (Capacitor status-bar overlay setting decides the inset value).
- Short landscape phones: smaller hero padding and bottom-nav height.
Not built or viewed. Still open: dialog/upload component restyle, tablet layouts, notifications, related research, screenshots at each size.
