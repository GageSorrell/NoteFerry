-- `app.profiles` — NoteFerry-specific user information that does not belong in the
-- Supabase-owned `auth.users` table (ArchitectureInitialDraft.md §10). One row
-- per authenticated user, keyed by the Supabase user id.

create table app.profiles (
    user_id uuid primary key references auth.users (id) on delete cascade,
    display_name text,
    -- App-wide, cross-device settings (`@noteferry/domain`'s `Settings.AppSettings`
    -- — launch behavior, home-screen database order, quick-action picks,
    -- offline-notify preference). Every field is optional in the schema, so an
    -- empty object decodes cleanly for a brand-new profile; `Settings.WithDefaults`
    -- fills the gaps. Per-database settings live on `app.destinations` instead.
    settings jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
    before update on app.profiles
    for each row execute function private.set_updated_at();

-- Auto-provision a profile row whenever a new Supabase user signs up. Runs with
-- definer rights (the trigger fires on the Supabase-owned `auth.users` table)
-- and an empty search_path so every reference must be fully qualified.
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into app.profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function app.handle_new_user();
