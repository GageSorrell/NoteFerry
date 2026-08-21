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

-- Account data requests: create and read your own; never update or delete —
-- fulfillment is a manual, out-of-band process.
grant select, insert on app.account_data_requests to authenticated;

-- Feedback & bug reports: create and read your own; never update or delete.
-- Rate-limited by `private.enforce_feedback_rate_limit` (§13) regardless of
-- which grant/path is used to insert.
grant select, insert on app.feedback_submissions to authenticated;

-- Backend role for the edge functions. `service_role` is NOT a client role — its
-- key lives only in the edge-function environment and never reaches the app — so
-- granting it access to `private` does not contradict the "no client-role grants
-- on private" rule above. The `api` and `notion-oauth-callback` functions run as
-- this role and need full DML on both schemas (ArchitectureInitialDraft.md §30).
grant usage on schema app to service_role;
grant usage on schema private to service_role;

grant select, insert, update, delete on all tables in schema app to service_role;
grant select, insert, update, delete on all tables in schema private to service_role;

alter default privileges in schema app
    grant select, insert, update, delete on tables to service_role;
alter default privileges in schema private
    grant select, insert, update, delete on tables to service_role;
