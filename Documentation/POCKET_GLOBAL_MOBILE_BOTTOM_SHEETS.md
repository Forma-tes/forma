# Pocket global mobile bottom sheets

## Change
- Standard Pocket modal-backdrop dialogs and alert dialogs now present as bottom sheets on screens up to 680px.
- The existing desktop centered-modal behavior is retained.
- Bottom sheets use a bounded dynamic viewport height, rounded top corners, and safe-area padding.
- Common form bodies can scroll independently, while action rows remain sticky at the bottom where the modal structure exposes a shared action row.
- Authentication popups are also bottom-aligned on mobile.

## Review notes
- This is a shared responsive CSS treatment; it does not alter dialog content, routes, validation, or submit/delete handlers.
- Some custom popups with unique internal markup should still be manually checked on small devices to confirm their content container and action row scroll independently.

## Manual test checklist
1. Open add/edit transaction, account, debt, goal, budget, recurring payment, vehicle, import, and confirmation dialogs on a narrow viewport.
2. Confirm each sheet is bottom-aligned and the page behind it does not scroll.
3. Scroll long forms and verify actions remain visible and the final field can be reached.
4. Check keyboard-open state, safe-area padding, close/backdrop behavior, and dark mode.
5. Verify desktop dialogs remain centered.
