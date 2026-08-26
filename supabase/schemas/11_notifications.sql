-- Fires the `notify-account-data-request` Edge Function whenever a row is
-- inserted into `app.account_data_requests`, so NoteFerry gets emailed to
-- fulfill the request by hand.
--
-- The function's URL and a shared secret (checked inside the function, since
-- it runs with `verify_jwt = false` — this is a server-to-server call, not a
-- user request) are read from Supabase Vault by name rather than embedded
-- here, so no secret value is ever committed. Create them once per
-- environment (the SQL editor, or `supabase secrets`/`psql`) before this
-- trigger can do anything:
--
--   select vault.create_secret(
--       'https://<project-ref>.supabase.co/functions/v1/notify-account-data-request',
--       'notify_account_data_request_url');
--   select vault.create_secret(
--       '<same value as the notify-account-data-request function''s WEBHOOK_SECRET>',
--       'notify_account_data_request_secret');
--
-- Until both secrets exist, the trigger silently no-ops rather than failing
-- the insert the user is waiting on.

create extension if not exists pg_net;

create or replace function private.notify_account_data_request()
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
        from vault.decrypted_secrets where name = 'notify_account_data_request_url';
    select decrypted_secret into webhook_secret
        from vault.decrypted_secrets where name = 'notify_account_data_request_secret';

    if webhook_url is null or webhook_secret is null then
        return new;
    end if;

    perform net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-noteferry-webhook-secret', webhook_secret
        ),
        body := jsonb_build_object(
            'id', new.id,
            'user_id', new.user_id,
            'created_at', new.created_at
        )
    );

    return new;
end;
$$;

create trigger account_data_requests_notify
    after insert on app.account_data_requests
    for each row execute function private.notify_account_data_request();

-- Fires the `notify-feedback-submission` Edge Function whenever a row is
-- inserted into `app.feedback_submissions`, so NoteFerry gets emailed the
-- feedback/bug report to triage by hand.
--
-- Reuses the same `notify_account_data_request_secret` value: both webhooks
-- are checked against the edge functions' shared `WEBHOOK_SECRET` env var, so
-- no new secret needs to be provisioned, only two new Vault entries pointing
-- at this function:
--
--   select vault.create_secret(
--       'https://<project-ref>.supabase.co/functions/v1/notify-feedback-submission',
--       'notify_feedback_submission_url');
--   select vault.create_secret(
--       '<same value as WEBHOOK_SECRET>',
--       'notify_feedback_submission_secret');
--
-- Until both secrets exist, the trigger silently no-ops rather than failing
-- the insert the user is waiting on.

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
            'x-noteferry-webhook-secret', webhook_secret
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
