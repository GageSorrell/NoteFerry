/**
 * Portable subscription, commercial-limit, and sale campaign schemas shared
 * by the mobile app and the authenticated API.
 *
 * @module @noteferry/domain/Subscription
 */

import * as Schema from "effect/Schema";

/**
 * RevenueCat entitlement lookup_key for Pro access. Must match the active
 * entitlement identifier configured in the RevenueCat dashboard exactly
 * (`Subscriber.entitlements[ProEntitlementId]` in
 * `supabase/functions/_shared/Subscriptions.ts`). This is not "pro" because
 * that identifier (and "noteferry_pro") is already reserved by an archived
 * entitlement in the project that isn't reachable/unarchivable via the
 * RevenueCat API tooling available at the time this was set up — see
 * RELEASE_CHECKLIST.md section 1E. If that archived entitlement is ever
 * unarchived and made current instead, update this constant to match.
 */
export const ProEntitlementId = "Notivex Pro";
export const FreeCreationLimit = 5;
export const FreeCreationWindowMinutes = 30;
export const FreeDatabaseLimit = 3;

export const SubscriptionTier = Schema.Literals([ "Free", "Pro" ]);
export type SubscriptionTier = typeof SubscriptionTier.Type;

export const ProductTerm = Schema.Literals([ "Monthly", "Yearly", "Lifetime" ]);
export type ProductTerm = typeof ProductTerm.Type;

export const PurchaseStore = Schema.Literals([ "AppStore", "PlayStore", "Unknown" ]);
export type PurchaseStore = typeof PurchaseStore.Type;

export const EntitlementState = Schema.Literals([
    "Active",
    "GracePeriod",
    "BillingIssue",
    "Expired",
    "Free"
]);
export type EntitlementState = typeof EntitlementState.Type;

export const SubscriptionStatus = Schema.Struct({
    Active: Schema.Boolean,
    EnforcementEnabled: Schema.Boolean,
    Expiration: Schema.optional(Schema.DateFromString),
    ManagementUrl: Schema.optional(Schema.String),
    ProductId: Schema.optional(Schema.String),
    Renews: Schema.Boolean,
    State: EntitlementState,
    Store: PurchaseStore,
    Term: Schema.optional(ProductTerm),
    Tier: SubscriptionTier,
    VerifiedAt: Schema.optional(Schema.DateFromString)
});
export type SubscriptionStatus = typeof SubscriptionStatus.Type;

export const CreationAllowance = Schema.Struct({
    Limit: Schema.Number,
    NextAvailableAt: Schema.optional(Schema.DateFromString),
    Remaining: Schema.Number,
    Used: Schema.Number,
    WindowMinutes: Schema.Number
});
export type CreationAllowance = typeof CreationAllowance.Type;

export const ActiveSale = Schema.Struct({
    CampaignId: Schema.String,
    Copy: Schema.String,
    DeepLink: Schema.String,
    EndsAt: Schema.DateFromString,
    OfferingIdentifier: Schema.String,
    StartsAt: Schema.DateFromString,
    TargetedPackages: Schema.Array(ProductTerm)
});
export type ActiveSale = typeof ActiveSale.Type;

export const ActiveSaleResponse = Schema.Struct({
    Sale: Schema.NullOr(ActiveSale)
});
export type ActiveSaleResponse = typeof ActiveSaleResponse.Type;

export const ResourceAccess = Schema.Literals([ "Available", "Locked" ]);
export type ResourceAccess = typeof ResourceAccess.Type;

export const DevicePlatform = Schema.Literals([ "Ios", "Android" ]);
export type DevicePlatform = typeof DevicePlatform.Type;
