-- The declarative profile schema includes cross-device settings, but the
-- original migration predated that column. Add it for existing projects and
-- backfill every profile with the same empty-object default used for new rows.
alter table app.profiles
    add column settings jsonb not null default '{}'::jsonb;
