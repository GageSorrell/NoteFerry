-- Row-level security for every client-visible table (ArchitectureInitialDraft.md
-- §18). The ownership model is `user_id = (select auth.uid())`; auth.uid() is
-- wrapped in a SELECT so it is evaluated once per query, not once per row, and
-- every filtered column is indexed (see each table's file).
--
-- Business operations (creating connections, refreshing schemas, creating
-- pages) run server-side through the Effect API with the service role, which
-- bypasses RLS. These policies govern only direct Data API access from the app:
-- read metadata freely; manage destinations directly (§29).

-- app.profiles -------------------------------------------------------------
alter table app.profiles enable row level security;

create policy profiles_select_own on app.profiles
    for select to authenticated
    using ((select auth.uid()) = user_id);

create policy profiles_update_own on app.profiles
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

-- app.notion_connections ---------------------------------------------------
alter table app.notion_connections enable row level security;

create policy notion_connections_select_own on app.notion_connections
    for select to authenticated
    using ((select auth.uid()) = user_id);

-- app.data_sources ---------------------------------------------------------
alter table app.data_sources enable row level security;

create policy data_sources_select_own on app.data_sources
    for select to authenticated
    using ((select auth.uid()) = user_id);

-- app.destinations ---------------------------------------------------------
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

-- app.operations -----------------------------------------------------------
alter table app.operations enable row level security;

create policy operations_select_own on app.operations
    for select to authenticated
    using ((select auth.uid()) = user_id);

-- private.* ----------------------------------------------------------------
-- Enable RLS with no policies: client roles can never read these rows, and the
-- service role (edge functions) bypasses RLS. Belt-and-braces with the schema
-- not being exposed and no grants issued.
alter table private.notion_connection_credentials enable row level security;
alter table private.notion_oauth_states enable row level security;
