-- Data API grants (ArchitectureInitialDraft.md §9). New Supabase projects no
-- longer auto-expose tables (config.toml leaves `auto_expose_new_tables` unset =
-- revoked), so client access must be granted explicitly. RLS still applies on
-- top of these grants — a role needs BOTH the grant and a passing policy.
--
-- Only the `authenticated` role is granted anything; `anon` (unauthenticated)
-- gets nothing, and the `private` schema is never granted to any client role.

grant usage on schema app to authenticated;

-- Read-only metadata.
grant select on app.notion_connections to authenticated;
grant select on app.data_sources to authenticated;
grant select on app.operations to authenticated;

-- Profiles: read and self-service display-name updates.
grant select, update on app.profiles to authenticated;

-- Destinations: full owner-scoped CRUD directly through the Data API (§29).
grant select, insert, update, delete on app.destinations to authenticated;
