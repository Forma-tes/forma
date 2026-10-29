# Pocket mobile bottom-sheet and sidebar fixes

- Removed the duplicate divider above the profile row; the sidebar footer retains one separator.
- Added visual viewport tracking so mobile modal backdrops and sheets size to the visible viewport when the on-screen keyboard opens.
- On field focus, the focused control is scrolled into view after the keyboard begins opening.
- Preserved the modal content and action controls; scroll containers use contained, momentum scrolling and bottom scroll padding.

## Validation

`npm install` timed out in this environment, so the Vite build could not be run here. Test on iOS Safari and Android Chrome with a long form: focus the first and last fields, verify the keyboard does not cover the field or actions, scroll the form, and verify the sidebar footer has only one divider.
