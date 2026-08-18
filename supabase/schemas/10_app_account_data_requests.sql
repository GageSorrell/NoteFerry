-- `app.account_data_requests` — a record that a user asked for a copy of
-- their account data (the "Request my data" button on the account-settings
-- screen). Fulfilled manually today: inserting a row fires the
-- `notify_account_data_request` trigger (see `11_notifications.sql`), which
-- emails Notivex so the export can be prepared by hand.

create table app.account_data_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    status text not null default 'pending'
        check (status in ('pending', 'fulfilled')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index account_data_requests_user_id_idx
    on app.account_data_requests (user_id);

create trigger account_data_requests_set_updated_at
    before update on app.account_data_requests
    for each row execute function private.set_updated_at();
