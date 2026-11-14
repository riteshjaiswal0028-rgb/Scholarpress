# v72: flagship fonts, spacing, motion, and one universal article format

## Fonts (bundled, so the Android app looks the same offline)
- Variable fonts now live in `src/assets/fonts`: Inter (UI), Source Serif 4 with optical sizes (headings and reading: big headings get the display cut), Geist Mono (metadata). Playfair Display is no longer used for headings. The Google Fonts link in `__root.tsx` is gone, so no font request leaves the app.
- `--font-serif` is Source Serif 4. Headings use tighter tracking and balanced lines; numbers use tabular lining figures.

## Spacing and motion (end of `styles.css`, "v72")
- Section and block spacing tokens, 44px minimum touch height, staggered entrances, hover/press transitions on cards and rows, input focus transitions, scroll-in for reader figures and headings. All motion sits inside `prefers-reduced-motion: no-preference`.

## Universal article format (`lib/domain/article-normalize.ts`)
Word and PDF text now go through the same normalizer, so every article reads the same:
- Headings: bold-only lines, numbered lines ("2.1 Methods") and custom Word heading styles (by name in several languages, or by outline level) become headings; levels are renumbered to one scale (h3 sections, h4 subsections); ALL CAPS becomes title case; all headings are bold.
- Paragraphs: author alignment and indents dropped. Body text is justified with hyphenation (left-aligned under 520px wide); structured-abstract lead-ins ("Methods:") are set bold.
- Captions: "Figure 1." / "Table 2:" captions are joined to their figure or table (caption above tables, below figures). Uncaptioned images get the same frame.
- Tables: header row found when not marked, numeric cells right-aligned, vertical merges kept (Word), tables rebuilt from aligned columns (PDF).
- References: hanging indent, also for numbered lists.
- Typography: curly quotes, dashes, ellipses, no-break space after "Figure"/"Table".
- Word extras: charts become data tables (title, series, categories, values), SmartArt becomes a node list, text boxes become callouts.
- PDF extras: tables are detected from column alignment (needs 3+ rows; numeric or 3+ columns, so two-column prose is not mistaken for a table). Figures cannot be extracted from a PDF here, so each figure caption gets a frame that opens the original PDF tab at that page.
- `STAMP_LAYOUT_VERSION` 7 to 8 so cached Word-to-PDF downloads regenerate with the new headings and chart rows. Author PDFs are still passed through unchanged.

## Checks
- `tsc --noEmit`: 0 errors. `vitest`: 476 pass (13 new). `vite build`: ok.
- NOT seen running: no browser or device here. Check one Word article and one PDF article on a phone (reading view), and the home screen motion.
- Known limits: scanned PDFs (no text) still show original pages only; embedded EMF/WMF Word images are skipped; PDF figures are not extracted as images; multi-column PDF layouts are still read in line order.

## v73: header logo
- Header logo redrawn to match the mockup: larger open book with page lines, gold dot above, wordmark "Scholarly" in medium-weight Source Serif in brand green (`site-header.tsx`, `.pm-wordmark`). Home texts already matched the mockup (hero, subtitle, button, search placeholder, trust row, stats, publishing steps).
