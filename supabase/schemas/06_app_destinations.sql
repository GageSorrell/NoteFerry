-- `app.destinations` — a first-class NoteFerry concept: how a user has configured
-- a quick-entry experience for one Notion data source
-- (ArchitectureInitialDraft.md §24-25). Mirrors `@noteferry/domain`
-- Destination.ts using the §25 hybrid: relational columns for what we query or
-- constrain, and one schema-versioned JSONB blob for flexible UI config.
--
-- `configuration` holds the versioned FieldConfiguration (field order, per-field
-- settings), the DestinationTemplate, and the optional PostCreationBehavior
-- (defaults to `Home` when absent, e.g. for destinations saved before this
-- field existed), decoded through Effect Schema whenever it enters
-- application code (§25). `data_source_id` is Notion's data-source id.

create table app.destinations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    connection_id uuid not null
        references app.notion_connections (id) on delete cascade,
    data_source_id text not null,
    name text not null,
    icon text,
    -- fractional so a destination can be reordered without renumbering siblings.
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
