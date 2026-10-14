-- `app.operations` — page-creation attempts/history and idempotency metadata
-- (ArchitectureInitialDraft.md §20). `id` is the client-generated OperationId,
-- created before the request is sent so an ambiguous outcome can be replayed
-- and detected rather than blindly retried.

create table app.operations (
    id uuid primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    destination_id uuid
        references app.destinations (id) on delete set null,
    connection_id uuid
        references app.notion_connections (id) on delete set null,
    payload jsonb not null,
    state text not null default 'pending'
        check (state in ('pending', 'succeeded', 'failed')),
    notion_page_id text,
    notion_page_title text,
    notion_page_url text,
    notion_page_created_at timestamptz,
    database_name text,
    page_icon text,
    page_icon_type text
        check (page_icon_type in ('Emoji', 'Image', 'Native')),
    page_icon_expires_at timestamptz,
    page_cover_url text,
    page_cover_expires_at timestamptz,
    notion_metadata_checked_at timestamptz,
    error text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index operations_user_id_idx on app.operations (user_id);
create index operations_destination_id_idx on app.operations (destination_id);
create index operations_recent_succeeded_idx
    on app.operations (user_id, created_at desc)
    where state = 'succeeded' and notion_page_id is not null;

create trigger operations_set_updated_at
    before update on app.operations
    for each row execute function private.set_updated_at();
