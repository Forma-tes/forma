# Pocket sidebar layering and mobile bottom-sheet keyboard fix

- Raised the mobile navigation drawer and its scrim above the fixed topbar so the drawer opens from the top edge and the Pocket brand row is not hidden beneath the header.
- Replaced broad `scrollIntoView()` focus behavior with targeted scrolling of the modal's own content region to avoid moving the page behind the sheet when the mobile keyboard opens.
- Kept mobile sheet height tied to the visual viewport, maintained a scrollable content area, and pinned action rows to the bottom of the sheet with safe-area padding.
- Set form controls in mobile dialogs to 16px to prevent iOS Safari's automatic focus zoom.

Manual verification recommended on iOS Safari and Android Chrome with a long form: open drawer, verify brand at top; open a modal, focus fields near the bottom, verify focused field remains visible and actions remain at the bottom of the visible sheet.
