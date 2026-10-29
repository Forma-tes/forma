# Transaction Date Sorting Fix

- The Transactions page now sorts using the date-only portion of `transaction_date`, avoiding timestamp/time-zone details from affecting the calendar-date order.
- When transactions share the same date, their explicit transaction time is used as a secondary sort key, newest first.
- Amount sorting options remain unchanged.
- This is a presentation-only change. No database schema, records, or Supabase migrations were changed.
