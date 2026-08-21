-- Feedback / bug-report submissions from the in-app "Submit feedback" /
-- "Report a bug" screen. See supabase/schemas/13_app_feedback_submissions.sql,
-- 08_rls.sql, 09_grants.sql and 11_notifications.sql for the annotated
-- source of truth.

create table app.feedback_submissions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    kind text not null check (kind in ('feedback', 'bug_report')),
    message text not null check (char_length(message) >= 12),
    share_contact boolean not null default true,
    created_at timestamptz not null default now()
);

create index feedback_submissions_user_created_idx
    on app.feedback_submissions (user_id, created_at);

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

alter table app.feedback_submissions enable row level security;

create policy feedback_submissions_select_own on app.feedback_submissions
    for select to authenticated
    using ((select auth.uid()) = user_id);

create policy feedback_submissions_insert_own on app.feedback_submissions
    for insert to authenticated
    with check ((select auth.uid()) = user_id);

grant select, insert on app.feedback_submissions to authenticated;

create or replace function private.notify_feedback_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    webhook_url text;
    webhook_secret text;
begin
    select decrypted_secret into webhook_url
        from vault.decrypted_secrets where name = 'notify_feedback_submission_url';
    select decrypted_secret into webhook_secret
        from vault.decrypted_secrets where name = 'notify_feedback_submission_secret';

    if webhook_url is null or webhook_secret is null then
        return new;
    end if;

    perform net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-notivex-webhook-secret', webhook_secret
        ),
        body := jsonb_build_object(
            'id', new.id,
            'user_id', new.user_id,
            'kind', new.kind,
            'message', new.message,
            'share_contact', new.share_contact,
            'created_at', new.created_at
        )
    );

    return new;
end;
$$;

create trigger feedback_submissions_notify
    after insert on app.feedback_submissions
    for each row execute function private.notify_feedback_submission();
