-- `app.operations` — page-creation attempts/history and idempotency metadata
-- (ArchitectureInitialDraft.md §20). `id` is the client-generated OperationId,
-- created before the request is sent so an ambiguous outcome can be replayed
-- and detected rather than blindly retried.

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
