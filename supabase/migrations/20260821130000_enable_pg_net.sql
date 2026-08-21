-- `pg_net` was declared in supabase/schemas/11_notifications.sql (needed by
-- both notify_account_data_request and notify_feedback_submission, which
-- call net.http_post) but never actually landed in a migration, so the `net`
-- schema does not exist on the remote database yet. Without it, any insert
-- into a table with one of those notify triggers fails inside the trigger
-- and rolls back the whole insert.

create extension if not exists pg_net;
