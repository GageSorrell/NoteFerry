-- `app.data_sources` — the normalized, cached Notion data-source schema Notivex
-- renders its quick-add UI from without a Notion round trip on every launch
-- (ArchitectureInitialDraft.md §11-12). Mirrors `@notivex/domain`
-- DataSource.ts `CachedDataSourceSchema`. Notion remains canonical.
--
-- `property_schema` holds the *normalized* Notivex schema (versioned
-- PropertyDefinition[] plus its Version), NOT an opaque dump of Notion's API
-- response, so a Notion API change only touches one mapper (§11).

create table app.data_sources (
    connection_id uuid not null
        references app.notion_connections (id) on delete cascade,
    notion_data_source_id text not null,
    user_id uuid not null references auth.users (id) on delete cascade,
    notion_database_id text not null,
    title text not null,
    cover_url text,
    icon text,
    icon_type text check (icon_type in ('Emoji', 'Image', 'Native')),
    property_schema jsonb not null,
    schema_hash text not null,
    notion_last_edited_time timestamptz not null,
    refreshed_at timestamptz not null default now(),
    primary key (connection_id, notion_data_source_id)
);

create index data_sources_user_id_idx on app.data_sources (user_id);
