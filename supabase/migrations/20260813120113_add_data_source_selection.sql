-- Existing cached rows predate explicit user selection and therefore must not
-- unlock the Home database-card screen. A row becomes selected only when the
-- user saves it explicitly or checks it during onboarding.
alter table app.data_sources
    add column selected boolean not null default false;
