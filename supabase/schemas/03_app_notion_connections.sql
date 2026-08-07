-- `app.notion_connections` — the non-secret metadata Notivex keeps about each
-- authorized Notion connection. Mirrors `@notivex/domain` NotionConnection.ts;
-- access/refresh tokens live only in `private` (ArchitectureInitialDraft.md §8).
--
-- `id` is Notivex-generated (NotionConnectionId). Notion-origin identifiers
-- (bot, workspace) are opaque strings from Notion and are stored as text.

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
    -- Notion issues one bot per installation; a user cannot hold the same
    -- installation twice.
    unique (user_id, bot_id)
);

-- RLS policies filter on `user_id`; index it (§18).
create index notion_connections_user_id_idx on app.notion_connections (user_id);
