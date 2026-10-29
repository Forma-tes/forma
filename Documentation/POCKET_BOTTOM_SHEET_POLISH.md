# Pocket mobile bottom-sheet polish

- Refined the mobile action footer spacing and divider so actions remain visually separated from scrollable content.
- Set modal form controls to a 16px minimum font size on mobile to prevent iOS Safari's automatic focus zoom.
- Added rendering hints for sheet transforms to keep the opening animation smooth.
- Reworked the mobile sidebar profile footer sizing, padding, avatar, and settings button alignment so the profile container stays inside the drawer.

## Validation
- CSS-only change; verify on iOS Safari and Android Chrome with short and long forms.
- Check that long form content scrolls independently and actions remain visible above the safe area.
- Confirm closing/opening transitions on-device; CSS can animate entry, while exit animation depends on the app's modal unmount/close lifecycle.
