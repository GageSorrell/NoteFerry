alter table app.operations
    add column connection_id uuid
        references app.notion_connections (id) on delete set null,
    add column notion_page_title text,
    add column notion_page_url text,
    add column notion_page_created_at timestamptz,
    add column database_name text,
    add column page_icon text,
    add column page_icon_type text
        check (page_icon_type in ('Emoji', 'Image', 'Native')),
    add column page_icon_expires_at timestamptz,
    add column page_cover_url text,
    add column page_cover_expires_at timestamptz,
    add column notion_metadata_checked_at timestamptz;

update app.operations as operation
set
    connection_id = destination.connection_id,
    database_name = data_source.title
from app.destinations as destination
left join app.data_sources as data_source
    on data_source.connection_id = destination.connection_id
    and data_source.notion_data_source_id = destination.data_source_id
where operation.destination_id = destination.id;

update app.operations
set
    notion_page_title = nullif(payload ->> 'Title', ''),
    notion_page_url = case
        when notion_page_id is null then null
        else 'https://www.notion.so/' || replace(notion_page_id, '-', '')
    end,
    notion_page_created_at = created_at,
    notion_metadata_checked_at = created_at
where state = 'succeeded';

create index operations_recent_succeeded_idx
    on app.operations (user_id, created_at desc)
    where state = 'succeeded' and notion_page_id is not null;
