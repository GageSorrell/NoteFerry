-- The declarative data-sources schema now caches each data source's Notion
-- page templates (name, icon, Notion's own default flag, and a snapshot of
-- each template's own property values) alongside its property schema, but
-- the original migration predated that column. Add it for existing projects,
-- backfilling every row with an empty list — the next `DataSources.Refresh`
-- call populates it for real.
alter table app.data_sources
    add column templates jsonb not null default '[]'::jsonb;
