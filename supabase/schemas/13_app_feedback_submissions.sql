-- `app.feedback_submissions` — user-submitted feedback and bug reports from
-- the in-app "Submit feedback"/"Report a bug" screen (Settings). Both share
-- one table and one screen, distinguished by `kind`; inserting a row fires
-- the `feedback_submissions_notify` trigger (see `11_notifications.sql`),
-- which emails Notivex so it can be triaged by hand.

create table app.feedback_submissions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    kind text not null check (kind in ('feedback', 'bug_report')),
    message text not null check (char_length(message) >= 12),
    share_contact boolean not null default true,
    created_at timestamptz not null default now()
);

-- Also serves `private.enforce_feedback_rate_limit`'s rolling-window count
-- below, and the `feedback_submissions_select_own` RLS policy (`08_rls.sql`).
create index feedback_submissions_user_created_idx
    on app.feedback_submissions (user_id, created_at);

-- Basic per-user rate limit: at most 3 submissions per rolling hour. Runs
-- `before insert` so it applies uniformly to every insert path (the `api`
-- edge function today; any future direct-client insert under the
-- `feedback_submissions_insert_own` grant tomorrow), not just one caller.
create or replace function private.enforce_feedback_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    recent_count integer;
begin
    select count(*) into recent_count
    from app.feedback_submissions
    where user_id = new.user_id
      and created_at > now() - interval '1 hour';

    if recent_count >= 3 then
        raise exception using
            errcode = 'P0001',
            message = 'RATE_LIMIT_EXCEEDED';
    end if;

    return new;
end;
$$;

create trigger feedback_submissions_rate_limit
    before insert on app.feedback_submissions
    for each row execute function private.enforce_feedback_rate_limit();
