/** Server-authoritative RevenueCat entitlement snapshots and commercial state. */

import * as Domain from "@noteferry/domain";
import { AdminClient, PrivateSchema } from "./Database.ts";
import { Effect } from "effect";

const VerifiedAccessGraceMilliseconds = 24 * 60 * 60 * 1000;

const DefaultStatus = (EnforcementEnabled = false): Domain.Subscription.SubscriptionStatus => ({
    Active: false,
    EnforcementEnabled,
    Renews: false,
    State: "Free",
    Store: "Unknown",
    Tier: "Free"
});

const ToStatus = (
    Row: Record<string, unknown> | null,
    EnforcementEnabled = false
): Domain.Subscription.SubscriptionStatus =>
{
    if (!Row)
    {
        return DefaultStatus(EnforcementEnabled);
    }

    const Expiration = Row.expiration ? new Date(Row.expiration as string) : undefined;
    const Lifetime = Row.product_term === "Lifetime";
    const Active = Row.active === true && (
        Lifetime
        || Expiration === undefined
        || Expiration.getTime() > Date.now() - VerifiedAccessGraceMilliseconds
    );

    return {
        Active,
        EnforcementEnabled,
        ...(Expiration ? { Expiration } : {}),
        ...(Row.management_url ? { ManagementUrl: Row.management_url as string } : {}),
        ...(Row.product_id ? { ProductId: Row.product_id as string } : {}),
        Renews: Row.renews === true,
        State: Active
            ? Row.state as Domain.Subscription.EntitlementState
            : Row.active === true ? "Expired" : Row.state as Domain.Subscription.EntitlementState,
        Store: Row.store as Domain.Subscription.PurchaseStore,
        ...(Row.product_term
            ? { Term: Row.product_term as Domain.Subscription.ProductTerm }
            : {}),
        Tier: Active ? Row.tier as Domain.Subscription.SubscriptionTier : "Free",
        ...(Row.verified_at ? { VerifiedAt: new Date(Row.verified_at as string) } : {})
    };
};

/** Returns the most recently verified server snapshot, defaulting safely Free. */
export const GetForUser = (UserId: string) =>
{
    return Effect.gen(function* ()
    {
        const [ Entitlement, Configuration ] = yield* Effect.promise(async () => Promise.all([
            AdminClient
                .from("subscription_entitlements")
                .select("*")
                .eq("user_id", UserId)
                .maybeSingle(),
            PrivateSchema
                .from("subscription_configuration")
                .select("enforcement_enabled")
                .eq("singleton", true)
                .single()
        ]));
        const { data, error } = Entitlement;

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }

        return ToStatus(
            data as Record<string, unknown> | null,
            Configuration.data?.enforcement_enabled === true
        );
    });
};

/** Reads the rolling 30-minute allowance computed by Postgres. */
export const GetAllowanceForUser = (UserId: string) =>
{
    return Effect.gen(function* ()
    {
        const { data, error } = yield* Effect.promise(async () =>
            await PrivateSchema.rpc("creation_allowance", { p_user_id: UserId }));

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }

        const Row = (data as ReadonlyArray<Record<string, unknown>> | null)?.[0];

        if (!Row)
        {
            /* Diagnostic detail only — DatabaseError.Message is never shown to a
             * user (the client only ever branches on `_tag`, falling back to a
             * generic client-side message otherwise), so this stays untranslated. */
            return yield* Effect.fail(new Domain.Error.DatabaseError({
                Message: "Creation allowance returned no row."
            }));
        }

        return {
            Limit: Row.allowance_limit as number,
            ...(Row.next_available_at
                ? { NextAvailableAt: new Date(Row.next_available_at as string) }
                : {}),
            Remaining: Row.remaining as number,
            Used: Row.used as number,
            WindowMinutes: Row.window_minutes as number
        } satisfies Domain.Subscription.CreationAllowance;
    });
};

/** Returns the one currently active, time-bounded sale campaign, if any. */
export const GetActiveSale = () =>
{
    return Effect.gen(function* ()
    {
        const Now = new Date().toISOString();
        const { data, error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("subscription_sales")
                .select("*")
                .eq("status", "active")
                .lte("starts_at", Now)
                .gt("ends_at", Now)
                .order("starts_at", { ascending: false })
                .limit(1)
                .maybeSingle());

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }

        return {
            Sale: data
                ? {
                    CampaignId: data.campaign_id,
                    Copy: data.copy,
                    DeepLink: data.deep_link,
                    EndsAt: new Date(data.ends_at),
                    OfferingIdentifier: data.offering_identifier,
                    StartsAt: new Date(data.starts_at),
                    TargetedPackages: data.targeted_packages
                }
                : null
        } satisfies Domain.Subscription.ActiveSaleResponse;
    });
};

export const RegisterDeviceForUser = (
    UserId: string,
    DeviceId: string,
    Platform: Domain.Subscription.DevicePlatform,
    PushToken: string
) =>
{
    return Effect.gen(function* ()
    {
        /* A physical token may have belonged to another signed-in account on
         * this device. Reassignment prevents cross-account delivery. */
        yield* Effect.promise(async () =>
            await AdminClient.from("push_devices").delete().eq("push_token", PushToken));

        const { error } = yield* Effect.promise(async () =>
            await AdminClient.from("push_devices").upsert({
                device_id: DeviceId,
                disabled_at: null,
                last_seen_at: new Date().toISOString(),
                platform: Platform,
                push_token: PushToken,
                user_id: UserId
            }, { onConflict: "user_id,device_id" }));

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }
    });
};

export const RemoveDeviceForUser = (UserId: string, DeviceId: string) =>
{
    return Effect.gen(function* ()
    {
        const { error } = yield* Effect.promise(async () =>
            await AdminClient
                .from("push_devices")
                .delete()
                .eq("user_id", UserId)
                .eq("device_id", DeviceId));

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }
    });
};

const ProductTerm = (ProductId: string): Domain.Subscription.ProductTerm =>
{
    const Value = ProductId.toLowerCase();

    if (Value.includes("lifetime")) return "Lifetime";
    if (Value.includes("annual") || Value.includes("year") || Value.includes("1y")) return "Yearly";
    return "Monthly";
};

const Store = (Value: string | undefined): Domain.Subscription.PurchaseStore =>
{
    if (Value === "app_store" || Value === "mac_app_store") return "AppStore";
    if (Value === "play_store") return "PlayStore";
    return "Unknown";
};

interface RevenueCatEntitlement
{
    readonly expires_date?: string | null;
    readonly grace_period_expires_date?: string | null;
    readonly product_identifier?: string | null;
}

interface RevenueCatPurchase
{
    readonly billing_issues_detected_at?: string | null;
    readonly grace_period_expires_date?: string | null;
    readonly store?: string | undefined;
    readonly unsubscribe_detected_at?: string | null;
}

interface RevenueCatNonSubscription
{
    readonly purchase_date?: string | undefined;
    readonly store?: string | undefined;
}

interface RevenueCatSubscriber
{
    readonly entitlements?: Record<string, RevenueCatEntitlement> | undefined;
    readonly management_url?: string | null;
    readonly non_subscriptions?: Record<string, readonly RevenueCatNonSubscription[]> | undefined;
    readonly subscriptions?: Record<string, RevenueCatPurchase> | undefined;
}

interface RevenueCatSubscriberResponse
{
    readonly subscriber?: RevenueCatSubscriber | undefined;
}

/** Queries RevenueCat instead of trusting webhook ordering, then upserts state. */
export const RefreshFromRevenueCat = (UserId: string) =>
{
    return Effect.gen(function* ()
    {
        const Secret = Deno.env.get("REVENUECAT_SECRET_API_KEY");

        if (!Secret)
        {
            /* Diagnostic detail only — NetworkError.Message is never shown to a
             * user (the client only ever branches on `_tag`, falling back to a
             * generic client-side message otherwise), so this stays untranslated. */
            return yield* Effect.fail(new Domain.Error.NetworkError({
                Message: "RevenueCat server configuration is unavailable."
            }));
        }

        const Response = yield* Effect.tryPromise({
            catch: (Error_) => new Domain.Error.NetworkError({ Message: String(Error_) }),
            try: () => fetch(
                `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(UserId)}`,
                { headers: { Authorization: `Bearer ${Secret}` } }
            )
        });

        if (!Response.ok)
        {
            return yield* Effect.fail(new Domain.Error.NetworkError({
                Message: `RevenueCat returned ${Response.status}.`
            }));
        }

        const Body = yield* Effect.tryPromise({
            catch: (Error_) => new Domain.Error.NetworkError({ Message: String(Error_) }),
            try: () => Response.json() as Promise<RevenueCatSubscriberResponse>
        });
        const Subscriber = Body.subscriber ?? {};
        const Entitlement = Subscriber.entitlements?.[Domain.Subscription.ProEntitlementId];
        const ProductId = Entitlement?.product_identifier as string | undefined;
        const Expiration = Entitlement?.expires_date as string | null | undefined;
        const Purchase = ProductId ? Subscriber.subscriptions?.[ProductId] : undefined;
        const NonSubscription = ProductId
            ? Subscriber.non_subscriptions?.[ProductId]?.at(-1)
            : undefined;
        const IsLifetime = Boolean(ProductId && (
            ProductTerm(ProductId) === "Lifetime"
            || (Expiration === null && Purchase === undefined)
        ));
        const GraceExpiration = Purchase?.grace_period_expires_date
            ?? Entitlement?.grace_period_expires_date;
        const Grace = Boolean(GraceExpiration
            && new Date(GraceExpiration).getTime() > Date.now());
        const Active = Boolean(Entitlement && (
            IsLifetime || Grace || !Expiration || new Date(Expiration).getTime() > Date.now()
        ));
        const BillingIssue = Boolean(Purchase?.billing_issues_detected_at);
        const State: Domain.Subscription.EntitlementState = Active
            ? BillingIssue
                ? Grace ? "GracePeriod" : "BillingIssue"
                : "Active"
            : Entitlement ? "Expired" : "Free";
        const Tier: Domain.Subscription.SubscriptionTier = Active ? "Pro" : "Free";
        const Row = {
            active: Active,
            expiration: Expiration ?? null,
            management_url: Subscriber.management_url ?? null,
            product_id: ProductId ?? null,
            product_term: ProductId ? IsLifetime ? "Lifetime" : ProductTerm(ProductId) : null,
            renews: Active && !IsLifetime && !Purchase?.unsubscribe_detected_at,
            revenuecat_app_user_id: UserId,
            state: State,
            store: Store(Purchase?.store ?? NonSubscription?.store),
            tier: Tier,
            user_id: UserId,
            verified_at: new Date().toISOString()
        };
        const { error } = yield* Effect.promise(async () =>
            await AdminClient.from("subscription_entitlements").upsert(Row));

        if (error)
        {
            return yield* Effect.fail(new Domain.Error.DatabaseError({ Message: error.message }));
        }

        if (Active)
        {
            const Profile = yield* Effect.promise(async () =>
                await AdminClient.from("profiles").select("settings").eq("user_id", UserId).single());
            const Settings = (Profile.data?.settings ?? {}) as Record<string, unknown>;

            if (Settings.NotifyOnSubscriptionSales === true)
            {
                yield* Effect.promise(async () =>
                    await AdminClient.from("profiles").update({
                        settings: { ...Settings, NotifyOnSubscriptionSales: false }
                    }).eq("user_id", UserId));
            }
        }
        else
        {
            const Profile = yield* Effect.promise(async () =>
                await AdminClient.from("profiles").select("settings").eq("user_id", UserId).single());
            const Settings = (Profile.data?.settings ?? {}) as Record<string, unknown>;
            const SavedOrder = Array.isArray(Settings.DatabaseOrder)
                ? Settings.DatabaseOrder.filter((Value): Value is string => typeof Value === "string")
                : [ ];

            yield* Effect.promise(async () =>
                await PrivateSchema.rpc("reproject_free_active_data_sources", {
                    p_saved_order: SavedOrder,
                    p_user_id: UserId
                }));
        }

        const Configuration = yield* Effect.promise(async () =>
            await PrivateSchema.from("subscription_configuration")
                .select("enforcement_enabled").eq("singleton", true).single());

        return ToStatus(Row, Configuration.data?.enforcement_enabled === true);
    });
};
