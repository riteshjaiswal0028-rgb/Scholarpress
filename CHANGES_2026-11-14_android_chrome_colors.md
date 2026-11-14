# v60: Android window and status-bar colour
- Finding: the launcher icon background is already cream (#FBF4E8, not navy), and the splash image is the same cream. The "launcher background still navy" line in REDESIGN_HANDOFF.md is stale. Foreground icon art was not re-checked.
- `capacitor.config.ts`: Android WebView background and status-bar colour changed from #ffffff to #f7f7f4 (the app's theme colour), so there is no white band or flash around the ivory pages. SplashScreen colour left alone (its image is cream).
- Correction: dark mode is never switched on. No code adds the `.dark` class, there is no theme toggle and no `prefers-color-scheme` handling, so the `.dark` palette in styles.css is currently unused and a dark status bar is moot. Turning dark mode on would be a feature decision (system-follow vs. toggle), then StatusBar style would need to follow it.
- Checks run: tsc 0 errors, vitest 466/466. Not run: `cap sync`, gradle build, any device or emulator.
