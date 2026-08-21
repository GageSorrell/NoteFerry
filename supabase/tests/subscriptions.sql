-- Core Notivex Pro database behavior. Run with `supabase test db` after reset.

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(15);

update private.subscription_configuration
set enforcement_enabled = true
where singleton = true;

insert into auth.users (id, email)
values ('10000000-0000-4000-8000-000000000001', 'subscription-test@notivex.invalid');

insert into app.notion_connections (
    id, user_id, bot_id, workspace_id, workspace_name
) values (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'test-bot', 'test-workspace', 'Test Workspace'
);

insert into app.data_sources (
    connection_id, notion_data_source_id, user_id, notion_database_id,
    title, selected, property_schema, schema_hash, notion_last_edited_time
)
select
    '20000000-0000-4000-8000-000000000001',
    'source-' || number,
    '10000000-0000-4000-8000-000000000001',
    'database-' || number,
    'Source ' || number,
    true,
    '[]'::jsonb,
    'hash-' || number,
    now()
from generate_series(1, 4) as number;

insert into app.destinations (
    id, user_id, connection_id, data_source_id, name, configuration
) values (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'source-1', 'Source 1', '{"Version":1}'::jsonb
);

select is(
    private.user_has_pro('10000000-0000-4000-8000-000000000001'),
    false,
    'a user without an entitlement is Free when enforcement is enabled'
);

select lives_ok(
    $$select private.reproject_free_active_data_sources(
        '10000000-0000-4000-8000-000000000001',
        array['source-4', 'source-2', 'source-1', 'source-3']
    )$$,
    'downgrade projection succeeds'
);

select is(
    (select count(*)::integer from app.data_sources
        where user_id = '10000000-0000-4000-8000-000000000001'
          and free_active),
    3,
    'downgrade projection activates exactly three databases'
);

select ok(
    (select free_active from app.data_sources
        where notion_data_source_id = 'source-4'),
    'saved home order determines the first active database'
);

select lives_ok(
    $$select private.swap_free_active_data_source(
        '10000000-0000-4000-8000-000000000001', 'source-3', 'source-2'
    )$$,
    'a Free active database can be swapped'
);

select ok(
    (select free_active from app.data_sources where notion_data_source_id = 'source-3'),
    'the replacement database becomes active'
);

select is(
    (select operation_state from private.reserve_page_operation(
        '10000000-0000-4000-8000-000000000001',
        '40000000-0000-4000-8000-000000000001',
        '30000000-0000-4000-8000-000000000001',
        '{}'::jsonb
    )),
    'pending',
    'the first idempotent operation reserves a slot'
);

select is(
    (select operation_state from private.reserve_page_operation(
        '10000000-0000-4000-8000-000000000001',
        '40000000-0000-4000-8000-000000000001',
        '30000000-0000-4000-8000-000000000001',
        '{}'::jsonb
    )),
    'already_pending',
    'an idempotent replay does not reserve another slot'
);

insert into app.operations (id, user_id, destination_id, payload, state, created_at)
select
    ('40000000-0000-4000-8000-' || lpad(number::text, 12, '0'))::uuid,
    '10000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '{}'::jsonb,
    case when number = 2 then 'failed' else 'succeeded' end,
    now() - interval '5 minutes'
from generate_series(2, 5) as number;

select is(
    (select used from private.creation_allowance(
        '10000000-0000-4000-8000-000000000001')),
    4,
    'failed operations release their reserved slot'
);

select is(
    (select remaining from private.creation_allowance(
        '10000000-0000-4000-8000-000000000001')),
    1,
    'one Free slot remains after four pending or successful operations'
);

update app.operations set state = 'succeeded'
where id = '40000000-0000-4000-8000-000000000002';

select is(
    (select remaining from private.creation_allowance(
        '10000000-0000-4000-8000-000000000001')),
    0,
    'five recent operations exhaust the Free window'
);

update app.operations set created_at = now() - interval '30 minutes 1 second'
where id = '40000000-0000-4000-8000-000000000002';

select is(
    (select remaining from private.creation_allowance(
        '10000000-0000-4000-8000-000000000001')),
    1,
    'an operation immediately outside the rolling window releases its slot'
);

update app.operations set created_at = now()
where id = '40000000-0000-4000-8000-000000000002';

select is(
    (select operation_state from private.reserve_page_operation(
        '10000000-0000-4000-8000-000000000001',
        '40000000-0000-4000-8000-000000000006',
        '30000000-0000-4000-8000-000000000001',
        '{}'::jsonb
    )),
    'limit_exceeded',
    'a sixth operation is rejected atomically'
);

select ok(
    (select next_available_at is not null from private.creation_allowance(
        '10000000-0000-4000-8000-000000000001')),
    'a full window returns the next available time'
);

insert into app.subscription_entitlements (
    user_id, tier, product_term, store, state, active, renews
) values (
    '10000000-0000-4000-8000-000000000001',
    'Pro', 'Lifetime', 'AppStore', 'Active', true, false
);

select is(
    (select allowance_limit from private.creation_allowance(
        '10000000-0000-4000-8000-000000000001')),
    2147483647,
    'Pro has no product-level creation limit'
);

select * from finish();
rollback;
