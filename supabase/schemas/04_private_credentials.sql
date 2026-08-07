-- Server-only Notion authorization state. These tables live in `private`, are
-- never exposed to the Data API, and are reachable only by the service role
-- (edge functions), which bypasses RLS (ArchitectureInitialDraft.md §7, §8).
--
-- Tokens are stored in plaintext for the MVP; Supabase Vault is the stronger
-- follow-up (§8) — switch `access_token`/`refresh_token` to Vault secret ids
-- without changing the rest of the architecture.

create table private.notion_connection_credentials (
    connection_id uuid primary key
        references app.notion_connections (id) on delete cascade,
    access_token text not null,
    -- Notion now issues a refresh token and rotates the pair on refresh (§31).
    refresh_token text,
    updated_at timestamptz not null default now()
);

create trigger notion_connection_credentials_set_updated_at
    before update on private.notion_connection_credentials
    for each row execute function private.set_updated_at();

-- Short-lived one-time OAuth state used to defend the notion-oauth-callback
-- flow against CSRF (§7). Rows are created when the flow starts and deleted
-- (or expired) once the callback verifies them.
create table private.notion_oauth_states (
    state text primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
);

create index notion_oauth_states_expires_at_idx
    on private.notion_oauth_states (expires_at);
