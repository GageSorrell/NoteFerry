/**
 * In-memory onboarding state that the root navigator uses to decide between the
 * onboarding flow and the app. Two things live here: whether the signed-in user
 * already has a Notion connection, and whether an onboarding run is currently
 * active. The latter keeps the flow on screen through the sync and confirmation
 * steps even after a connection is created, and lets the shared Notion sync
 * operation begin on the grant screen and survive route changes. Nothing is
 * persisted — a returning user who already has a connection skips straight to
 * the app, since nothing marks the run active on a cold start.
 *
 * @module notivex/features/onboarding/onboarding-context
 *
 * @file      onboarding-context.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import * as React from "react";
import type { AsyncThunk, Thunk } from "@sorrell/utility/Function";
import { type UseNotionSync, useNotionSync } from "@/features/onboarding/use-notion-sync";
import { ListConnections } from "@/Domain/Runtime/NotivexApi";
import { UseAuth } from "@/Domain/Auth";

/** The onboarding state shared through {@link useOnboarding}. */
export interface OnboardingState
{
    readonly AuthorizationSucceeded: boolean | null;
    readonly HasConnection: boolean;
    readonly IsActive: boolean;
    readonly IsLoadingConnection: boolean;
    readonly NotionSync: UseNotionSync;
    readonly Begin: Thunk;
    readonly Complete: Thunk;
    readonly RecordAuthorizationResult: (Succeeded: boolean) => void;
    readonly RefetchConnection: AsyncThunk;
}

const OnboardingContext = React.createContext<OnboardingState>({
    AuthorizationSucceeded: null,
    Begin: () => { },
    Complete: () => { },
    HasConnection: false,
    IsActive: false,
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
export function OnboardingProvider({
    Enabled = true,
    children
}: OnboardingProviderProps)
{
    const { Session } = UseAuth();
    const [ HasConnection, SetHasConnection ] = React.useState(false);
    const [ IsLoadingConnection, SetIsLoadingConnection ] = React.useState(true);
    const [ IsActive, SetIsActive ] = React.useState(false);
    const [ AuthorizationSucceeded, SetAuthorizationSucceeded ] =
        React.useState<boolean | null>(null);
    const NotionSync = useNotionSync(
        Enabled && IsActive,
        AuthorizationSucceeded
    );

    const RefetchConnection = React.useCallback(async () =>
    {
        if (!Enabled)
        {
            SetHasConnection(false);
            SetIsLoadingConnection(false);

            return;
        }

        if (Session === null)
        {
            SetHasConnection(false);
            SetIsLoadingConnection(false);

            return;
        }

        SetIsLoadingConnection(true);

        try
        {
            const List = await ListConnections();

            SetHasConnection(List.some((Connection: Domain.NotionConnection.NotionConnection) =>
                Connection.Status === "Active"));
        }
        catch (Error)
        {
            /* eslint-disable-next-line no-console */
            console.error("Failed to check for a Notion connection", Error);
        }
        finally
        {
            SetIsLoadingConnection(false);
        }
    }, [ Enabled, Session ]);

    React.useEffect(() => void RefetchConnection(), [ RefetchConnection ]);

    const Begin = React.useCallback(() =>
    {
        SetAuthorizationSucceeded(null);
        SetIsActive(true);
    }, [ ]);
    const Complete = React.useCallback(() =>
    {
        SetAuthorizationSucceeded(null);
        SetIsActive(false);
    }, [ ]);
    const RecordAuthorizationResult = React.useCallback((Succeeded: boolean) =>
    {
        SetAuthorizationSucceeded(Succeeded);
    }, [ ]);

    const Value = React.useMemo<OnboardingState>(() => ({
        AuthorizationSucceeded,
        Begin,
        Complete,
        HasConnection,
        IsActive,
        IsLoadingConnection,
        NotionSync,
        RecordAuthorizationResult,
        RefetchConnection
    }), [
        AuthorizationSucceeded,
        Begin,
        Complete,
        HasConnection,
        IsActive,
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
}

export/**
       * Reads the onboarding state provided by {@link OnboardingProvider}.
       *
       * @category Onboarding
       * @since 1.0.0
       */
const useOnboarding = (): OnboardingState => React.useContext(OnboardingContext);
