-- NoteFerry database: schema layout and shared utilities.
--
-- `app`     — client-readable state, exposed through the Data API and protected
--             by row-level security (ArchitectureInitialDraft.md §9, §18).
-- `private` — server-only state (Notion tokens, OAuth CSRF). Exposed to the Data
--             API only so the service_role edge functions can reach it through
--             PostgREST; client roles are never granted access (§8, §9).

create schema if not exists app;
create schema if not exists private;

-- `private` is listed in `[api] schemas` so the edge functions can reach it as
-- service_role, but client roles get nothing: revoke all access here, and the
-- tables additionally run under RLS with no client policies (defense in depth).
revoke all on schema private from anon, authenticated;

-- Shared trigger that stamps `updated_at` on every row update. Lives in
-- `private` so it is never reachable from the Data API. Runs as the invoking
-- table owner; no elevated privileges required.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;
