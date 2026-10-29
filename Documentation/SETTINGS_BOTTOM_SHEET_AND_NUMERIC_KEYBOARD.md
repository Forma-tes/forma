# Settings Bottom Sheet and Numeric Keyboards

## Changes
- Removed the theme toggle from the sidebar profile footer and placed the Settings gear button in that same position. The separate Settings row was removed to avoid duplicate navigation; the gear opens the existing Settings modal.
- On small screens, the Settings modal is presented as a bottom sheet with rounded top corners and a capped dynamic viewport height.
- The Settings content area scrolls independently, while the Done action stays pinned at the bottom. Safe-area insets are included for devices with a home indicator.
- Desktop Settings modal behavior remains unchanged.
- Added `inputMode="decimal"` to all numeric inputs so mobile browsers show a numeric keypad that supports decimal amounts. Existing input types, validation, min/max and step rules remain in place.

## Manual checks
1. Open the sidebar on desktop and mobile; confirm the footer shows the profile and Settings gear, with no theme toggle and no duplicate Settings row.
2. Tap the gear and verify it opens Settings.
3. On mobile, scroll through Settings; verify the content scrolls independently and Done remains visible at the bottom.
4. Check that the sheet respects the bottom safe area and can be dismissed using the existing close/backdrop behavior.
5. Focus numeric amount, price, balance, odometer, and count fields on a mobile device; verify a numeric keypad appears and decimal values can still be entered where allowed.
6. Run `npm install` and `npm run build` in an environment with package registry access.
