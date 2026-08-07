-- Notivex database: schema layout and shared utilities.
--
-- `app`     — client-readable state, exposed through the Data API and protected
--             by row-level security (ArchitectureInitialDraft.md §9, §18).
-- `private` — server-only state (Notion tokens, OAuth CSRF). Never exposed to
--             the Data API and never granted to client roles (§8, §9).

create schema if not exists app;
create schema if not exists private;

-- Defense in depth: the `private` schema is not listed in `[api] schemas`, but
-- explicitly deny the client roles any access regardless.
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
