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

import * as React from "react";
import { type UseNotionSync, useNotionSync } from "@/features/onboarding/use-notion-sync";
import { ListConnections } from "@/Domain/Runtime/NotivexApi";
import { UseAuth } from "@/Domain/Auth";

/** The onboarding state shared through {@link useOnboarding}. */
export interface OnboardingState
{
    readonly HasConnection: boolean;
    readonly IsActive: boolean;
    readonly IsLoadingConnection: boolean;
    readonly NotionSync: UseNotionSync;
    readonly Begin: () => void;
    readonly Complete: () => void;
    readonly RefetchConnection: () => Promise<void>;
}

const OnboardingContext = React.createContext<OnboardingState>({
    Begin: () => { },
    Complete: () => { },
    HasConnection: false,
    IsActive: false,
    IsLoadingConnection: true,
    NotionSync:
    {
        Count: 0,
        Retry: () => { },
        Status: "Syncing"
    },
    RefetchConnection: async () => { }
});

/**
 * Provides onboarding state to the tree. Mount once, below the auth provider so
 * it can react to the session appearing and disappearing.
 *
 * @category Providers
 * @since 1.0.0
 */
export function OnboardingProvider({ children }: React.PropsWithChildren)
{
    const { Session } = UseAuth();
    const [ HasConnection, SetHasConnection ] = React.useState(false);
    const [ IsLoadingConnection, SetIsLoadingConnection ] = React.useState(true);
    const [ IsActive, SetIsActive ] = React.useState(false);
    const NotionSync = useNotionSync(IsActive);

    const RefetchConnection = React.useCallback(async () =>
    {
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

            SetHasConnection(List.length > 0);
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
    }, [ Session ]);

    React.useEffect(() => void RefetchConnection(), [ RefetchConnection ]);

    const Begin = React.useCallback(() => SetIsActive(true), [ ]);
    const Complete = React.useCallback(() => SetIsActive(false), [ ]);

    const Value = React.useMemo<OnboardingState>(() => ({
        Begin,
        Complete,
        HasConnection,
        IsActive,
        IsLoadingConnection,
        NotionSync,
        RefetchConnection
    }), [
        Begin,
        Complete,
        HasConnection,
        IsActive,
        IsLoadingConnection,
        NotionSync,
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
