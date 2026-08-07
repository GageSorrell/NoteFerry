-- Initial Notivex backend persistence foundation.
--
-- This migration is the concatenation of the declarative schema files under
-- `supabase/schemas/*.sql` (the human source of truth), applied in filename
-- order. It was applied directly to the linked project because no local Docker
-- shadow database was available to run `supabase db diff`. When Docker is
-- available, future changes should edit the declarative files and regenerate
-- migrations with `supabase db diff`.

-- 01_schemas.sql ----------------------------------------------------------
create schema if not exists app;
create schema if not exists private;

revoke all on schema private from anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

-- 02_app_profiles.sql -----------------------------------------------------
create table app.profiles (
    user_id uuid primary key references auth.users (id) on delete cascade,
    display_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
    before update on app.profiles
    for each row execute function private.set_updated_at();

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

-- 03_app_notion_connections.sql -------------------------------------------
create table app.notion_connections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    bot_id text not null,
    workspace_id text not null,
    workspace_name text not null,
    workspace_icon_url text,
    notion_owner_user_id text,
    status text not null default 'Active' check (status in ('Active', 'Revoked')),
    connected_at timestamptz not null default now(),
    last_used_at timestamptz,
    revoked_at timestamptz,
    unique (user_id, bot_id)
);

create index notion_connections_user_id_idx on app.notion_connections (user_id);

-- 04_private_credentials.sql ----------------------------------------------
create table private.notion_connection_credentials (
    connection_id uuid primary key
        references app.notion_connections (id) on delete cascade,
    access_token text not null,
    refresh_token text,
    updated_at timestamptz not null default now()
);

create trigger notion_connection_credentials_set_updated_at
    before update on private.notion_connection_credentials
    for each row execute function private.set_updated_at();

create table private.notion_oauth_states (
    state text primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
);

create index notion_oauth_states_expires_at_idx
    on private.notion_oauth_states (expires_at);

-- 05_app_data_sources.sql -------------------------------------------------
create table app.data_sources (
    connection_id uuid not null
        references app.notion_connections (id) on delete cascade,
    notion_data_source_id text not null,
    user_id uuid not null references auth.users (id) on delete cascade,
    notion_database_id text not null,
    title text not null,
    icon text,
    property_schema jsonb not null,
    schema_hash text not null,
    notion_last_edited_time timestamptz not null,
    refreshed_at timestamptz not null default now(),
    primary key (connection_id, notion_data_source_id)
);

create index data_sources_user_id_idx on app.data_sources (user_id);

-- 06_app_destinations.sql -------------------------------------------------
create table app.destinations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    connection_id uuid not null
        references app.notion_connections (id) on delete cascade,
    data_source_id text not null,
    name text not null,
    icon text,
    position double precision not null default 0,
    enabled boolean not null default true,
    configuration jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index destinations_user_id_idx on app.destinations (user_id);
create index destinations_connection_id_idx on app.destinations (connection_id);

create trigger destinations_set_updated_at
    before update on app.destinations
    for each row execute function private.set_updated_at();

-- 07_app_operations.sql ---------------------------------------------------
create table app.operations (
    id uuid primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    destination_id uuid
        references app.destinations (id) on delete set null,
    payload jsonb not null,
    state text not null default 'pending'
        check (state in ('pending', 'succeeded', 'failed')),
    notion_page_id text,
    error text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index operations_user_id_idx on app.operations (user_id);
create index operations_destination_id_idx on app.operations (destination_id);

create trigger operations_set_updated_at
    before update on app.operations
    for each row execute function private.set_updated_at();

-- 08_rls.sql --------------------------------------------------------------
alter table app.profiles enable row level security;

create policy profiles_select_own on app.profiles
    for select to authenticated
    using ((select auth.uid()) = user_id);

create policy profiles_update_own on app.profiles
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

alter table app.notion_connections enable row level security;

create policy notion_connections_select_own on app.notion_connections
    for select to authenticated
    using ((select auth.uid()) = user_id);

alter table app.data_sources enable row level security;

create policy data_sources_select_own on app.data_sources
    for select to authenticated
    using ((select auth.uid()) = user_id);

alter table app.destinations enable row level security;

create policy destinations_select_own on app.destinations
    for select to authenticated
    using ((select auth.uid()) = user_id);

create policy destinations_insert_own on app.destinations
    for insert to authenticated
    with check ((select auth.uid()) = user_id);

create policy destinations_update_own on app.destinations
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy destinations_delete_own on app.destinations
    for delete to authenticated
    using ((select auth.uid()) = user_id);

alter table app.operations enable row level security;

create policy operations_select_own on app.operations
    for select to authenticated
    using ((select auth.uid()) = user_id);

alter table private.notion_connection_credentials enable row level security;
alter table private.notion_oauth_states enable row level security;

-- 09_grants.sql -----------------------------------------------------------
grant usage on schema app to authenticated;

grant select on app.notion_connections to authenticated;
grant select on app.data_sources to authenticated;
grant select on app.operations to authenticated;
grant select, update on app.profiles to authenticated;
grant select, insert, update, delete on app.destinations to authenticated;
