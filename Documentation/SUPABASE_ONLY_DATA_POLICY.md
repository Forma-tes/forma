# Supabase-only data storage

Pocket uses Supabase as the source of truth for application data. Financial records, vehicle records, user profiles/access, configurable categories, and per-user preferences are stored in Supabase. Browser local storage and session storage are not used as a database or offline data cache. When Supabase is not configured, Pocket does not load or save local demo records; it asks for Supabase configuration instead.

UI state such as an open modal or selected tab may exist in memory while the page is running, but it is not persisted as application data.
