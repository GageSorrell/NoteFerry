-- Feedback/bug-report submissions: message-length check and the basic
-- per-user rate limit. Run with `supabase test db` after reset.

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(6);

insert into auth.users (id, email)
values ('40000000-0000-4000-8000-000000000001', 'feedback-test@notivex.invalid');

select throws_ok(
    $$insert into app.feedback_submissions (user_id, kind, message)
      values ('40000000-0000-4000-8000-000000000001', 'feedback', 'too short')$$,
    null,
    null,
    'a message under 12 characters is rejected'
);

select lives_ok(
    $$insert into app.feedback_submissions (user_id, kind, message)
      values ('40000000-0000-4000-8000-000000000001', 'feedback', 'First submission, well over the minimum length.')$$,
    'the 1st submission in the window succeeds'
);

select lives_ok(
    $$insert into app.feedback_submissions (user_id, kind, message)
      values ('40000000-0000-4000-8000-000000000001', 'bug_report', 'Second submission, well over the minimum length.')$$,
    'the 2nd submission in the window succeeds'
);

select lives_ok(
    $$insert into app.feedback_submissions (user_id, kind, message)
      values ('40000000-0000-4000-8000-000000000001', 'feedback', 'Third submission, well over the minimum length.')$$,
    'the 3rd submission in the window succeeds'
);

select throws_ok(
    $$insert into app.feedback_submissions (user_id, kind, message)
      values ('40000000-0000-4000-8000-000000000001', 'feedback', 'Fourth submission, well over the minimum length.')$$,
    null,
    'RATE_LIMIT_EXCEEDED',
    'a 4th submission within the rolling hour is rate-limited'
);

select is(
    (select count(*)::integer from app.feedback_submissions
        where user_id = '40000000-0000-4000-8000-000000000001'),
    3,
    'the rejected 4th submission was not written'
);

select * from finish();
rollback;
