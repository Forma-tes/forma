# Sidebar dropdown refinements

- Renamed WORKSPACE to MY SPACE.
- Made MY SPACE collapsible.
- Made VEHICLE MANAGEMENT collapsible and nested its Overview, My Vehicles, Maintenance, Service History, and Reminders links inside.
- Made Access management collapsible under Administration, retaining Requests, Users, and the pending-request count.
- Dropdowns automatically open when their current page is active.

## Editable My Space section title

The `MY SPACE` sidebar group title can now be renamed using the pencil icon shown on hover/focus. The inline editor validates a non-empty name, saves it to browser local storage, and restores the chosen title on reload. This label is a local UI preference and is not synced across devices.

## Compact sidebar layout fix

Refined compact mode spacing and icon alignment, constrained overflow, preserved the bottom profile alignment, and corrected the RTL main-content offset. On small mobile layouts, compact mode expands to the full navigation labels for usability.

## Administration dropdown and compact sidebar correction

Administration is now a collapsible sidebar section containing Access Management (itself collapsible) and Expense Categories. Compact mode hides section labels and text cleanly, centers icon-only controls, and avoids wrapped Access Management text. RTL main content offset is explicitly handled.

## Sidebar group icons

Added a layers icon to My Space and a chart icon to Analyze. In compact mode, the group icons remain visible while the text labels are hidden.
