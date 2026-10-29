# Transaction time and sorting

- Transaction times stored as `HH:mm` or `HH:mm:ss` are displayed directly as local clock values rather than parsed as UTC dates, avoiding timezone shifts.
- When a transaction has no explicit transaction time, the created/inserted timestamp is formatted in the browser's local timezone.
- Transactions can be sorted by date newest-to-oldest or oldest-to-newest. Transactions on the same date are sorted by time in the same direction.
- Amount sorting remains available.
