/**
 * In-memory onboarding state that the root navigator uses to decide between the
 * onboarding flow and the app. Two things live here: whether the signed-in user
 * already has a Notion connection, and whether an onboarding run is currently
 * active. The latter keeps the flow on screen through the sync and confirmation
 * steps even after a connection is created, and lets the shared Notion sync
 * operation begin when authorization returns and survive route changes. Pending
 * onboarding is persisted until confirmation so an OAuth callback, reload, or
 * process recreation cannot skip the database-selection screen.
 *
 * @module noteferry/features/onboarding/onboarding-context
 *
 * @file      onboarding-context.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import * as React from "react";
import { BootStoreGet, BootStoreGetLate } from "@/Domain/Runtime/BootStore";
import { ListConnections, ListDataSources } from "@/Domain/Runtime/NoteFerryApi";
import { type UseNotionSync, useNotionSync } from "@/features/onboarding/use-notion-sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AsyncThunk } from "@sorrell/effect/Function";
import { useAuth } from "@/Domain/Auth";

const PendingOnboardingStorageKey = "@noteferry/onboarding-pending" as const;

/* How long the post-sign-in connection check may block onboarding navigation.
 * Neither `ListConnections` nor `ListDataSources` carries a network timeout of
 * its own, so a slow dependency (a cold Supabase Edge Function, a dropped
 * connection with no server-side response) can otherwise leave
 * `IsLoadingConnection` -- and with it `RootNavigator`'s blocking gate, which
 * offers no escape for this reason the way it does for a slow session
 * restore -- stuck on `RestoringSessionScreen` forever, right after the user
 * finishes signing in with Notion. */
const ConnectionCheckTimeoutMs = 10_000;

/** Rejects with a timeout error if `Target` has not settled within the budget. */
const WithTimeout = <Value,>(Target: Promise<Value>): Promise<Value> => Promise.race([
    Target,
    new Promise<never>((_Resolve, Reject: (Reason: unknown) => void): void =>
    {
        setTimeout(
            () => Reject(new Error("Timed out checking the Notion connection")),
            ConnectionCheckTimeoutMs
        );
    })
]);

/** The onboarding state shared through {@link useOnboarding}. */
export interface OnboardingState
{
    readonly AuthorizationSucceeded: boolean | null;
    readonly HasConnection: boolean;
    readonly HasSelectedDatabases: boolean;
    readonly IsActive: boolean;
    readonly IsAuthorizing: boolean;
    readonly IsLoadingActivity: boolean;
    readonly IsLoadingConnection: boolean;
    readonly NotionSync: UseNotionSync;
    readonly Begin: AsyncThunk;
    readonly Complete: AsyncThunk;
    readonly RecordAuthorizationResult: (Succeeded: boolean) => void;
    readonly RefetchConnection: AsyncThunk;
}

const OnboardingContext = React.createContext<OnboardingState>({
    AuthorizationSucceeded: null,
    Begin: async () => { },
    Complete: async () => { },
    HasConnection: false,
    HasSelectedDatabases: false,
    IsActive: false,
    IsAuthorizing: false,
    IsLoadingActivity: true,
    IsLoadingConnection: true,
    NotionSync:
    {
        Count: 0,
        Data: null,
        Retry: () => { },
        Status: "Syncing"
    },
    RecordAuthorizationResult: () => { },
    RefetchConnection: async () => { }
});

/** Props for {@link OnboardingProvider}. */
export interface OnboardingProviderProps extends React.PropsWithChildren
{
    /** Disables all connection and sync I/O while development mocks are active. */
    readonly Enabled?: boolean | undefined;
}

/**
 * Provides onboarding state to the tree. Mount once, below the auth provider so
 * it can react to the session appearing and disappearing.
 *
 * @category Providers
 * @since 1.0.0
 */
export const OnboardingProvider = ({
    Enabled = true,
    children
}: OnboardingProviderProps) =>
{
    const { Session } = useAuth();
    const [ HasConnection, SetHasConnection ] = React.useState(false);
    const [ HasSelectedDatabases, SetHasSelectedDatabases ] = React.useState(false);
    const [ IsLoadingConnection, SetIsLoadingConnection ] = React.useState(true);
    const [ IsActive, SetIsActive ] = React.useState(false);
    const [ IsAuthorizing, SetIsAuthorizing ] = React.useState(false);
    const [ IsLoadingActivity, SetIsLoadingActivity ] = React.useState(true);
    const [ AuthorizationSucceeded, SetAuthorizationSucceeded ] =
        React.useState<boolean | null>(null);
    const EffectiveAuthorizationSucceeded = AuthorizationSucceeded
        ?? (!IsAuthorizing
            && HasConnection
            && (IsActive || !HasSelectedDatabases)
            ? true
            : null);
    const NotionSync = useNotionSync(
        Enabled
            && (IsActive || !HasSelectedDatabases)
            && Session !== null,
        EffectiveAuthorizationSucceeded
    );

    React.useEffect(() =>
    {
        let Cancelled = false;
        let Resolved = false;

        void BootStoreGet(PendingOnboardingStorageKey).then((Value: string | null) =>
        {
            if (!Cancelled)
            {
                Resolved = true;
                SetIsActive(Enabled && Value === "true");
                SetIsLoadingActivity(false);
            }
        });

        /* `BootStoreGet` above is budget-limited and may resolve "absent" on a
         * slow cold start before the real value is in. The underlying read is
         * never abandoned, so pick up the true value if it arrives afterward
         * rather than silently stranding an in-progress onboarding run. */
        void BootStoreGetLate(PendingOnboardingStorageKey).then((Value: string | null) =>
        {
            if (!Cancelled && Resolved)
            {
                SetIsActive(Enabled && Value === "true");
            }
        });

        return () =>
        {
            Cancelled = true;
        };
    }, [ Enabled ]);

    const RefetchConnection = React.useCallback(async () =>
    {
        if (!Enabled)
        {
            SetHasConnection(false);
            SetHasSelectedDatabases(false);
            SetIsLoadingConnection(false);

            return;
        }

        if (Session === null)
        {
            SetHasConnection(false);
            SetHasSelectedDatabases(false);
            SetIsLoadingConnection(false);

            return;
        }

        /* A newly established Supabase session is visible before its transient
         * Notion provider token has been adopted by the API. Reading connection
         * state in that gap produces an expected authorization failure and can
         * misclassify the user as disconnected. The authorization result causes
         * this callback to be recreated and run once adoption has finished. */
        if (IsAuthorizing)
        {
            SetIsLoadingConnection(false);

            return;
        }

        SetIsLoadingConnection(true);

        /* Settled independently rather than `Promise.all` — a `DataSources`
         * failure (e.g. a cached row that fails to encode) must not also
         * discard a perfectly good `Connections` result, or a real, already-
         * completed connection reads back as "not connected" and sends the
         * user through the Notion OAuth flow again for no reason. */
        const [ ConnectionsResult, DataSourcesResult ] = await Promise.allSettled([
            WithTimeout(ListConnections()),
            WithTimeout(ListDataSources())
        ]);

        if (ConnectionsResult.status === "fulfilled")
        {
            SetHasConnection(ConnectionsResult.value.some((
                Connection: Domain.NotionConnection.NotionConnection
            ) => Connection.Status === "Active"));
        }
        else
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to check for a Notion connection", ConnectionsResult.reason);
        }

        if (DataSourcesResult.status === "fulfilled")
        {
            SetHasSelectedDatabases(DataSourcesResult.value.length > 0);
        }
        else
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to check for selected databases", DataSourcesResult.reason);
        }

        SetIsLoadingConnection(false);
    }, [ Enabled, IsAuthorizing, Session ]);

    React.useEffect(() => void RefetchConnection(), [ RefetchConnection ]);

    const Begin = React.useCallback(async () =>
    {
        SetAuthorizationSucceeded(null);
        SetIsActive(true);
        SetIsAuthorizing(true);

        try
        {
            await AsyncStorage.setItem(PendingOnboardingStorageKey, "true");
        }
        catch (Error)
        {
            /* The current run can still continue even if persistence fails. */
            /* eslint-disable-next-line no-console */
            console.error("Failed to persist onboarding progress", Error);
        }
    }, [ ]);
    const Complete = React.useCallback(async () =>
    {
        SetAuthorizationSucceeded(null);
        SetIsActive(false);
        SetIsAuthorizing(false);

        try
        {
            await AsyncStorage.removeItem(PendingOnboardingStorageKey);
        }
        catch (Error)
        {
            /* Completion should not strand the user if storage is unavailable. */
            /* eslint-disable-next-line no-console */
            console.error("Failed to clear onboarding progress", Error);
        }
    }, [ ]);
    const RecordAuthorizationResult = React.useCallback((Succeeded: boolean) =>
    {
        SetAuthorizationSucceeded(Succeeded);
        SetIsAuthorizing(false);
    }, [ ]);

    const Value = React.useMemo<OnboardingState>(() => ({
        AuthorizationSucceeded: EffectiveAuthorizationSucceeded,
        Begin,
        Complete,
        HasConnection,
        HasSelectedDatabases,
        IsActive,
        IsAuthorizing,
        IsLoadingActivity,
        IsLoadingConnection,
        NotionSync,
        RecordAuthorizationResult,
        RefetchConnection
    }), [
        EffectiveAuthorizationSucceeded,
        Begin,
        Complete,
        HasConnection,
        HasSelectedDatabases,
        IsActive,
        IsAuthorizing,
        IsLoadingActivity,
        IsLoadingConnection,
        NotionSync,
        RecordAuthorizationResult,
        RefetchConnection
    ]);

    return (
        <OnboardingContext.Provider value={ Value }>
            { children }
        </OnboardingContext.Provider>
    );
};

export/**
       * Reads the onboarding state provided by {@link OnboardingProvider}.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const useOnboarding = (): OnboardingState => React.useContext(OnboardingContext);
