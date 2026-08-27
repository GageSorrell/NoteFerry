/**
 * RevenueCat purchase runtime plus server-authoritative entitlement context.
 *
 * @module noteferry/Domain/Subscription/SubscriptionProvider
 *
 * @file      SubscriptionProvider.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import * as React from "react";
import {
    GetActiveSubscriptionSale,
    GetCreationAllowance,
    GetSubscriptionStatus,
    RefreshSubscriptionStatus
} from "@/Domain/Runtime/NoteFerryApi";
import type { PurchasesPackage } from "react-native-purchases";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { InitializeAdsRuntime } from "@/Domain/Ads/AdsRuntime";
import { Platform } from "react-native";
import { SetConfirmedFree } from "@/Domain/Ads/Entitlement";
import { useAuth } from "@/Domain/Auth/NoteFerryAuthProvider";
import { LoadPurchases } from "./Purchases";

/**
 * The subscription state and actions exposed to the mobile application.
 *
 * @category Subscription
 * @since 1.0.0
 */
export interface SubscriptionContextValue
{
    readonly Allowance: Domain.Subscription.CreationAllowance | null;
    readonly HasProAccess: boolean;
    readonly IsLoading: boolean;
    readonly IsFinishingPurchase: boolean;
    readonly IsStoreAvailable: boolean;
    readonly Packages: ReadonlyArray<PurchasesPackage>;
    readonly Purchase: (Package: PurchasesPackage) => Promise<void>;
    readonly Refresh: () => Promise<void>;
    readonly Restore: () => Promise<void>;
    readonly Sale: Domain.Subscription.ActiveSale | null;
    readonly Status: Domain.Subscription.SubscriptionStatus | null;
}

const Context = React.createContext<SubscriptionContextValue | null>(null);
const PaidStatusCachePrefix = "noteferry:verified-pro:";
const PaidAccessGraceMilliseconds = 24 * 60 * 60 * 1000;

/**
 * Indicates that a successful purchase is still waiting for server-side
 * entitlement synchronization. Carries no user-facing text — this is a
 * domain-layer tag only; the UI layer (`App/subscribe.tsx`) owns the copy
 * shown for it via `t("subscription:purchaseSyncPending.title"/".body")`.
 *
 * @category Subscription
 * @since 1.0.0
 */
export class PurchaseSyncPendingError extends Error
{
    public constructor()
    {
        super("PurchaseSyncPending");
        this.name = "PurchaseSyncPendingError";
    }
}

const CachePaidStatus = async (
    UserId: string,
    Status: Domain.Subscription.SubscriptionStatus
): Promise<void> =>
{
    const Key = `${PaidStatusCachePrefix}${UserId}`;
    if (!Status.Active)
    {
        await AsyncStorage.removeItem(Key);
        return;
    }

    await AsyncStorage.setItem(Key, JSON.stringify(Status));
};

const ReadCachedPaidStatus = async (
    UserId: string
): Promise<Domain.Subscription.SubscriptionStatus | null> =>
{
    const Value = await AsyncStorage.getItem(`${PaidStatusCachePrefix}${UserId}`);
    if (!Value)
    {
        return null;
    }

    try
    {
        const Stored = JSON.parse(Value) as Domain.Subscription.SubscriptionStatus;
        const Expiration = Stored.Expiration ? new Date(`${Stored.Expiration}`) : undefined;
        const StillValid = Stored.Active && (
            Stored.Term === "Lifetime"
            || Expiration === undefined
            || Expiration.getTime() > Date.now() - PaidAccessGraceMilliseconds
        );

        return StillValid
            ? {
                ...Stored,
                ...(Expiration ? { Expiration } : { }),
                ...(Stored.VerifiedAt ? { VerifiedAt: new Date(`${Stored.VerifiedAt}`) } : { })
            }
            : null;
    }
    catch
    {
        return null;
    }
};

const WaitForServerPro = async (): Promise<Domain.Subscription.SubscriptionStatus> =>
{
    let Last: Domain.Subscription.SubscriptionStatus | null = null;

    for (let Attempt = 0; Attempt < 6; Attempt += 1)
    {
        Last = await RefreshSubscriptionStatus();

        if (Last.Active)
        {
            return Last;
        }

        await new Promise((Resolve: (_: unknown) => void) => setTimeout(Resolve, 1000 * (Attempt + 1)));
    }

    return Last ?? await GetSubscriptionStatus();
};

export/**
       * Provides subscription state, purchase actions, and server-authoritative
       * entitlement synchronization to descendant components.
       *
       * @category Subscription
       * @since 1.0.0
       */
const SubscriptionProvider = (
    { children }: React.PropsWithChildren
): React.JSX.Element =>
{
    "use no memo";

    const { Session } = useAuth();
    const [ Status, SetStatus ] = React.useState<Domain.Subscription.SubscriptionStatus | null>(null);
    const [ Allowance, SetAllowance ] = React.useState<Domain.Subscription.CreationAllowance | null>(null);
    const [ Sale, SetSale ] = React.useState<Domain.Subscription.ActiveSale | null>(null);
    const [ Packages, SetPackages ] = React.useState<ReadonlyArray<PurchasesPackage>>([ ]);
    const [ IsLoading, SetIsLoading ] = React.useState(true);
    const [ IsFinishingPurchase, SetIsFinishingPurchase ] = React.useState(false);
    const [ IsStoreAvailable, SetIsStoreAvailable ] = React.useState(false);
    const OfferingIds = React.useRef<ReadonlySet<string>>(new Set());
    const CurrentUserId = React.useRef(Session?.user.id);
    const PurchasesUserId = React.useRef<string | null>(null);

    React.useEffect(() =>
    {
        CurrentUserId.current = Session?.user.id;
    }, [ Session?.user.id ]);

    const Refresh = React.useCallback(async (): Promise<void> =>
    {
        if (!Session)
        {
            return;
        }
        const UserId = Session.user.id;

        const [ NextStatus, NextAllowance, NextSale ] = await Promise.all([
            GetSubscriptionStatus(),
            GetCreationAllowance(),
            GetActiveSubscriptionSale()
        ]);
        if (CurrentUserId.current !== UserId)
        {
            return;
        }
        let ResolvedSale = NextSale;

        SetStatus(NextStatus);
        SetAllowance(NextAllowance);
        SetConfirmedFree(!NextStatus.Active);
        void CachePaidStatus(UserId, NextStatus).catch(() => undefined);
        if (NextStatus.Active)
        {
            SetIsFinishingPurchase(false);
        }

        if (!NextStatus.Active)
        {
            void InitializeAdsRuntime();
        }

        try
        {
            const { default: Purchases } = await LoadPurchases();
            if (Platform.OS !== "web" && await Purchases.isConfigured())
            {
                const Offerings = await Purchases.getOfferings();
                OfferingIds.current = new Set(Object.keys(Offerings.all));
                const Offering = NextSale
                    ? Offerings.all[NextSale.OfferingIdentifier]
                    : Offerings.current;
                ResolvedSale = NextSale && !Offering ? null : NextSale;
                SetPackages(Offering?.availablePackages ?? [ ]);
                SetIsStoreAvailable(Boolean(Offering));
            }
        }
        catch
        {
            ResolvedSale = null;
            SetPackages([ ]);
            SetIsStoreAvailable(false);
        }
        if (CurrentUserId.current !== UserId)
        {
            return;
        }
        SetSale(NextStatus.Active || (ResolvedSale
            && !OfferingIds.current.has(ResolvedSale.OfferingIdentifier))
            ? null
            : ResolvedSale);
    }, [ Session ]);

    React.useEffect(() =>
    {
        let Cancelled = false;

        if (!Session)
        {
            if (PurchasesUserId.current !== null)
            {
                PurchasesUserId.current = null;
                void LoadPurchases()
                    .then(async ({ default: Purchases }) =>
                    {
                        if (await Purchases.isConfigured())
                        {
                            await Purchases.logOut();
                        }
                    })
                    .catch(() => undefined);
            }
            SetConfirmedFree(null);
            void Promise.resolve().then(() =>
            {
                if (Cancelled)
                {
                    return;
                }
                SetIsFinishingPurchase(false);
                SetStatus(null);
                SetAllowance(null);
                SetSale(null);
                SetPackages([ ]);
                SetIsLoading(false);
            });
            return;
        }

        SetConfirmedFree(null);

        void (async () =>
        {
            await Promise.resolve();
            if (!Cancelled)
            {
                SetIsLoading(true);
            }
            try
            {
                const Cached = await ReadCachedPaidStatus(Session.user.id);
                if (Cached && !Cancelled)
                {
                    SetStatus(Cached);
                    SetConfirmedFree(false);
                }

                // const ApiKey = Platform.OS === "ios"
                //     ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
                //     : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

                const ApiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

                if (ApiKey && Platform.OS !== "web")
                {
                    const { default: Purchases, LOG_LEVEL } = await LoadPurchases();
                    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);

                    if (!await Purchases.isConfigured())
                    {
                        Purchases.configure({ apiKey: ApiKey, appUserID: Session.user.id });
                    }
                    else
                    {
                        await Purchases.logIn(Session.user.id);
                    }
                    PurchasesUserId.current = Session.user.id;
                }

                await Refresh();
            }
            catch (Error_)
            {
                /* Status remains unresolved: ads stay suppressed *
                 * and checkout remains unavailable until retry.  */
                /* eslint-disable-next-line no-console */
                console.error("Failed to initialize subscriptions", Error_);
            }
            finally
            {
                if (!Cancelled)
                {
                    SetIsLoading(false);
                }
            }
        })();

        return () => { Cancelled = true; };
    }, [ Refresh, Session ]);

    const FinishPurchase = React.useCallback(async (KeepRetrying: boolean): Promise<boolean> =>
    {
        const UserId = Session?.user.id;
        if (!UserId)
        {
            return false;
        }
        SetIsFinishingPurchase(KeepRetrying);
        const NextStatus = await WaitForServerPro();
        if (CurrentUserId.current !== UserId)
        {
            return false;
        }

        SetStatus(NextStatus);
        SetSale(null);
        SetConfirmedFree(!NextStatus.Active);
        SetAllowance(await GetCreationAllowance());
        void CachePaidStatus(UserId, NextStatus).catch(() => undefined);

        if (NextStatus.Active)
        {
            SetIsFinishingPurchase(false);
            return true;
        }

        if (!KeepRetrying)
        {
            SetIsFinishingPurchase(false);
            return false;
        }

        void (async () =>
        {
            for (let Attempt = 0; Attempt < 12; Attempt += 1)
            {
                await new Promise((Resolve: (_: unknown) => void) => setTimeout(Resolve, 5000));
                try
                {
                    const Retried = await RefreshSubscriptionStatus();

                    if (CurrentUserId.current !== UserId)
                    {
                        return;
                    }
                    if (!Retried.Active)
                    {
                        continue;
                    }

                    SetStatus(Retried);
                    SetSale(null);
                    SetConfirmedFree(false);
                    SetAllowance(await GetCreationAllowance());
                    void CachePaidStatus(UserId, Retried).catch(() => undefined);
                    SetIsFinishingPurchase(false);
                    return;
                }
                catch
                {
                    // The next bounded retry handles temporary API unavailability.
                }
            }
        })();

        throw new PurchaseSyncPendingError();
    }, [ Session?.user.id ]);

    const Purchase = React.useCallback(async (Package: PurchasesPackage): Promise<void> =>
    {
        const { default: Purchases } = await LoadPurchases();
        await Purchases.purchasePackage(Package);
        await FinishPurchase(true);
    }, [ FinishPurchase ]);

    const Restore = React.useCallback(async (): Promise<void> =>
    {
        const { default: Purchases } = await LoadPurchases();
        await Purchases.restorePurchases();
        await FinishPurchase(false);
    }, [ FinishPurchase ]);

    const Value = React.useMemo<SubscriptionContextValue>(() => ({
        Allowance,
        HasProAccess: Status?.Active === true || Status?.EnforcementEnabled === false,
        IsFinishingPurchase,
        IsLoading,
        IsStoreAvailable,
        Packages,
        Purchase,
        Refresh,
        Restore,
        Sale,
        Status
    }), [
        Allowance,
        IsFinishingPurchase,
        IsLoading,
        IsStoreAvailable,
        Packages,
        Purchase,
        Refresh,
        Restore,
        Sale,
        Status
    ]);

    return (
        <Context.Provider value={ Value }>
            { children }
        </Context.Provider>
    );
};

export/**
       * Reads the subscription context provided by {@link SubscriptionProvider}.
       *
       * @category Subscription
       * @since 1.0.0
       */
const useSubscription = (): SubscriptionContextValue =>
{
    const Value = React.useContext(Context);

    if (!Value)
    {
        throw new Error("useSubscription must be used inside SubscriptionProvider.");
    }

    return Value;
};
