-- Preserve the authorizing Notion user's profile image for the app home avatar.
alter table app.notion_connections
    add column if not exists notion_owner_avatar_url text;
