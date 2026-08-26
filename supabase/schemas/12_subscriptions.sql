-- NoteFerry Pro billing snapshots, free-tier enforcement, sale campaigns, and
-- promotional push delivery state. RevenueCat remains billing source of truth.

alter table app.data_sources
    add column free_active boolean not null default false;

with ranked as (
    select connection_id, notion_data_source_id,
        row_number() over (
            partition by user_id
            order by selected desc, refreshed_at asc, notion_data_source_id
        ) as slot
    from app.data_sources
)
update app.data_sources as data_source
set free_active = ranked.slot <= 3
from ranked
where data_source.connection_id = ranked.connection_id
  and data_source.notion_data_source_id = ranked.notion_data_source_id;

create index data_sources_user_free_active_idx
    on app.data_sources (user_id, free_active);

create table app.subscription_entitlements (
    user_id uuid primary key references auth.users (id) on delete cascade,
    tier text not null default 'Free' check (tier in ('Free', 'Pro')),
    product_term text check (product_term in ('Monthly', 'Yearly', 'Lifetime')),
    store text not null default 'Unknown'
        check (store in ('AppStore', 'PlayStore', 'Unknown')),
    state text not null default 'Free'
        check (state in ('Active', 'GracePeriod', 'BillingIssue', 'Expired', 'Free')),
    product_id text,
    active boolean not null default false,
    renews boolean not null default false,
    expiration timestamptz,
    management_url text,
    revenuecat_app_user_id text,
    verified_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (
        (tier = 'Free' and active = false)
        or (tier = 'Pro' and product_term is not null)
    )
);

create table private.subscription_configuration (
    singleton boolean primary key default true check (singleton),
    enforcement_enabled boolean not null default false,
    updated_at timestamptz not null default now()
);

insert into private.subscription_configuration (singleton, enforcement_enabled)
values (true, false);

create trigger subscription_configuration_set_updated_at
    before update on private.subscription_configuration
    for each row execute function private.set_updated_at();

alter table private.subscription_configuration enable row level security;
grant select, insert, update, delete on private.subscription_configuration to service_role;

create or replace function private.commercial_enforcement_enabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select coalesce((
        select enforcement_enabled
        from private.subscription_configuration
        where singleton = true
    ), false);
$$;

revoke all on function private.commercial_enforcement_enabled()
    from public, anon, authenticated;
grant execute on function private.commercial_enforcement_enabled() to service_role;


create index subscription_entitlements_active_idx
    on app.subscription_entitlements (active, verified_at);

create trigger subscription_entitlements_set_updated_at
    before update on app.subscription_entitlements
    for each row execute function private.set_updated_at();

create table app.subscription_sales (
    campaign_id text primary key,
    status text not null default 'draft'
        check (status in ('draft', 'scheduled', 'active', 'ended')),
    copy text not null,
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    offering_identifier text not null,
    targeted_packages text[] not null default '{}',
    deep_link text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (ends_at > starts_at),
    check (targeted_packages <@ array['Monthly', 'Yearly', 'Lifetime']::text[])
);

create index subscription_sales_active_window_idx
    on app.subscription_sales (status, starts_at, ends_at);

create trigger subscription_sales_set_updated_at
    before update on app.subscription_sales
    for each row execute function private.set_updated_at();

create table app.push_devices (
    user_id uuid not null references auth.users (id) on delete cascade,
    device_id text not null,
    push_token text not null unique,
    platform text not null check (platform in ('Ios', 'Android')),
    last_seen_at timestamptz not null default now(),
    disabled_at timestamptz,
    created_at timestamptz not null default now(),
    primary key (user_id, device_id)
);

create index push_devices_delivery_idx
    on app.push_devices (user_id, disabled_at, last_seen_at);

create table private.revenuecat_webhook_events (
    event_id text primary key,
    event_type text not null,
    app_user_id text,
    body jsonb not null,
    received_at timestamptz not null default now(),
    processed_at timestamptz,
    processing_error text
);

create table private.subscription_sale_deliveries (
    campaign_id text not null references app.subscription_sales (campaign_id)
        on delete cascade,
    user_id uuid not null references auth.users (id) on delete cascade,
    device_id text not null,
    expo_ticket_id text,
    state text not null default 'pending'
        check (state in ('pending', 'ticketed', 'delivered', 'retry', 'failed')),
    attempt_count integer not null default 0,
    next_attempt_at timestamptz not null default now(),
    last_error text,
    updated_at timestamptz not null default now(),
    primary key (campaign_id, user_id, device_id)
);

create index subscription_sale_deliveries_pending_idx
    on private.subscription_sale_deliveries (state, next_attempt_at);

create trigger subscription_sale_deliveries_set_updated_at
    before update on private.subscription_sale_deliveries
    for each row execute function private.set_updated_at();

create or replace function private.user_has_pro(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select not private.commercial_enforcement_enabled() or coalesce((
        select entitlement.active
            and entitlement.state in ('Active', 'GracePeriod', 'BillingIssue')
            and (
                entitlement.product_term = 'Lifetime'
                or entitlement.expiration is null
                -- Previously verified purchases keep a bounded outage grace so
                -- a delayed RevenueCat refresh cannot immediately relock data.
                or entitlement.expiration > now() - interval '24 hours'
            )
        from app.subscription_entitlements as entitlement
        where entitlement.user_id = p_user_id
    ), false);
$$;

create or replace function private.creation_allowance(p_user_id uuid)
returns table (
    allowance_limit integer,
    used integer,
    remaining integer,
    window_minutes integer,
    next_available_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
    with recent as (
        select operation.created_at
        from app.operations as operation
        where operation.user_id = p_user_id
          and operation.state in ('pending', 'succeeded')
          and operation.created_at > now() - interval '30 minutes'
    ), usage as (
        select count(*)::integer as count, min(created_at) as oldest
        from recent
    )
    select
        case when private.user_has_pro(p_user_id) then 2147483647 else 5 end,
        usage.count,
        case when private.user_has_pro(p_user_id)
            then 2147483647
            else greatest(0, 5 - usage.count)
        end,
        30,
        case when not private.user_has_pro(p_user_id) and usage.count >= 5
            then usage.oldest + interval '30 minutes'
            else null
        end
    from usage;
$$;

create or replace function private.reserve_page_operation(
    p_user_id uuid,
    p_operation_id uuid,
    p_destination_id uuid,
    p_payload jsonb
)
returns table (
    operation_state text,
    notion_page_id text,
    next_available_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    existing app.operations%rowtype;
    allowance record;
    destination_active boolean;
    is_retry boolean := false;
begin
    perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

    select * into existing
    from app.operations
    where id = p_operation_id and user_id = p_user_id;

    if found and existing.state in ('pending', 'succeeded') then
        return query select
            case when existing.state = 'pending' then 'already_pending' else existing.state end,
            existing.notion_page_id,
            null::timestamptz;
        return;
    elsif found then
        is_retry := true;
    end if;

    if not private.user_has_pro(p_user_id) then
        select data_source.free_active into destination_active
        from app.destinations as destination
        join app.data_sources as data_source
          on data_source.connection_id = destination.connection_id
         and data_source.notion_data_source_id = destination.data_source_id
        where destination.id = p_destination_id
          and destination.user_id = p_user_id;

        if coalesce(destination_active, false) = false then
            raise exception using
                errcode = 'P0001',
                message = 'FEATURE_GATE:database';
        end if;

        select * into allowance from private.creation_allowance(p_user_id);

        if allowance.remaining <= 0 then
            return query
                select 'limit_exceeded'::text, null::text,
                    allowance.next_available_at;
            return;
        end if;
    end if;

    if is_retry then
        update app.operations
        set destination_id = p_destination_id,
            payload = p_payload,
            state = 'pending',
            notion_page_id = null,
            error = null,
            created_at = now()
        where id = p_operation_id and user_id = p_user_id;
    else
        insert into app.operations (
            id, user_id, destination_id, payload, state
        ) values (
            p_operation_id, p_user_id, p_destination_id, p_payload, 'pending'
        );
    end if;

    return query select 'pending'::text, null::text, null::timestamptz;
end;
$$;

alter table app.subscription_entitlements enable row level security;
create policy subscription_entitlements_select_own
    on app.subscription_entitlements
    for select to authenticated
    using ((select auth.uid()) = user_id);

alter table app.subscription_sales enable row level security;
alter table app.push_devices enable row level security;
alter table private.revenuecat_webhook_events enable row level security;
alter table private.subscription_sale_deliveries enable row level security;

grant select on app.subscription_entitlements to authenticated;
grant select, insert, update, delete on app.subscription_entitlements to service_role;
grant select, insert, update, delete on app.subscription_sales to service_role;
grant select, insert, update, delete on app.push_devices to service_role;
grant select, insert, update, delete on private.revenuecat_webhook_events to service_role;
grant select, insert, update, delete on private.subscription_sale_deliveries to service_role;

revoke all on function private.user_has_pro(uuid) from public, anon, authenticated;
revoke all on function private.creation_allowance(uuid) from public, anon, authenticated;
revoke all on function private.reserve_page_operation(uuid, uuid, uuid, jsonb)
    from public, anon, authenticated;
grant execute on function private.user_has_pro(uuid) to service_role;
grant execute on function private.creation_allowance(uuid) to service_role;
grant execute on function private.reserve_page_operation(uuid, uuid, uuid, jsonb)
    to service_role;

create or replace function private.swap_free_active_data_source(
    p_user_id uuid,
    p_activate_data_source_id text,
    p_lock_data_source_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if private.user_has_pro(p_user_id) then
        return;
    end if;

    if not exists (
        select 1 from app.data_sources
        where user_id = p_user_id
          and notion_data_source_id = p_activate_data_source_id
          and selected = true
    ) or not exists (
        select 1 from app.data_sources
        where user_id = p_user_id
          and notion_data_source_id = p_lock_data_source_id
          and selected = true
          and free_active = true
    ) then
        raise exception using errcode = 'P0002', message = 'DATA_SOURCE_NOT_FOUND';
    end if;

    update app.data_sources
    set free_active = notion_data_source_id = p_activate_data_source_id
    where user_id = p_user_id
      and notion_data_source_id in (
        p_activate_data_source_id,
        p_lock_data_source_id
      );
end;
$$;

create or replace function private.remove_data_source_from_noteferry(
    p_user_id uuid,
    p_data_source_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    was_active boolean;
begin
    select free_active into was_active
    from app.data_sources
    where user_id = p_user_id
      and notion_data_source_id = p_data_source_id
      and selected = true
    for update;

    if not found then
        return false;
    end if;

    update app.data_sources
    set selected = false, free_active = false
    where user_id = p_user_id
      and notion_data_source_id = p_data_source_id;

    if was_active and not private.user_has_pro(p_user_id) then
        update app.data_sources
        set free_active = true
        where (connection_id, notion_data_source_id) = (
            select connection_id, notion_data_source_id
            from app.data_sources
            where user_id = p_user_id
              and selected = true
              and free_active = false
            order by refreshed_at asc, notion_data_source_id
            limit 1
        );
    end if;

    return true;
end;
$$;

revoke all on function private.swap_free_active_data_source(uuid, text, text)
    from public, anon, authenticated;
revoke all on function private.remove_data_source_from_noteferry(uuid, text)
    from public, anon, authenticated;
grant execute on function private.swap_free_active_data_source(uuid, text, text)
    to service_role;
grant execute on function private.remove_data_source_from_noteferry(uuid, text)
    to service_role;

create or replace function private.reproject_free_active_data_sources(
    p_user_id uuid,
    p_saved_order text[]
)
returns void
language sql
security definer
set search_path = ''
as $$
    with ranked as (
        select connection_id, notion_data_source_id,
            row_number() over (
                order by
                    coalesce(array_position(p_saved_order, notion_data_source_id), 2147483647),
                    refreshed_at asc,
                    notion_data_source_id
            ) as slot
        from app.data_sources
        where user_id = p_user_id and selected = true
    )
    update app.data_sources as data_source
    set free_active = ranked.slot <= 3
    from ranked
    where data_source.connection_id = ranked.connection_id
      and data_source.notion_data_source_id = ranked.notion_data_source_id;
$$;

revoke all on function private.reproject_free_active_data_sources(uuid, text[])
    from public, anon, authenticated;
grant execute on function private.reproject_free_active_data_sources(uuid, text[])
    to service_role;
