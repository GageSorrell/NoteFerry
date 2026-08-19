/**
 * @module notivex/App/Root/Navigator
 *
 * @file      Navigator.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    OnboardingMockRegistry,
    useDevelopmentOnboarding
} from "@/features/onboarding/onboarding-development";
import type { Action } from "expo-quick-actions";
import type { Href } from "expo-router";
import { Stack } from "expo-router";
import { useAuth } from "@/Domain/Auth/NotivexAuthProvider";
import { useCallback } from "react";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useOnboarding } from "@/features/onboarding/onboarding-context";
import { useQuickActionCallback } from "expo-quick-actions/hooks";

/**
 * The navigator, split out so it can read the auth and onboarding contexts
 * provided above it. The reachable routes are chosen from a stage derived purely
 * from `session + has-connection` (plus an in-memory "onboarding active" flag) —
 * nothing is persisted, so a returning user with a connection lands straight in
 * the app while a first-run user is walked through onboarding.
 */
export function RootNavigator()
{
    /* The React Compiler otherwise memoizes this consumer so aggressively that
     * auth/onboarding context changes do not re-render it, stranding the app on
     * a blank gate. Opt out so stage transitions take effect. */
    "use no memo";

    const { IsLoading: IsLoadingSession, Session } = useAuth();
    const {
        HasConnection,
        HasSelectedDatabases,
        IsActive,
        IsLoadingActivity,
        IsLoadingConnection
    } = useOnboarding();
    const Development = useDevelopmentOnboarding();
    const Router = useLazyRouter();

    const IsAuthenticated = Session !== null;

    /* Three mutually exclusive stages: signed out → welcome + sign-in; signed in
     * without a usable connection (or mid-flow) → sync/done; signed in with a
     * connection → the app. Computed unconditionally (ahead of the loading
     * early-return below) so every hook on this component, including the
     * quick-action listener that reads `IsInApp`, runs on every render. */
    const MockStage = Development.Scenario === null
        ? null
        : OnboardingMockRegistry[Development.Scenario].Stage;
    const IsSignedOut = Development.Active
        ? MockStage === "SignedOut"
        : !IsAuthenticated;
    const IsInOnboarding = Development.Active
        ? MockStage === "Onboarding"
        : IsAuthenticated
            && (!HasConnection || !HasSelectedDatabases || IsActive);
    const IsInApp = !Development.Active
        && IsAuthenticated
        && HasConnection
        && HasSelectedDatabases
        && !IsActive;
    const CanAccessDatabaseConfiguration = Development.Active
        ? MockStage === "Onboarding"
        : IsAuthenticated;

    /* A quick-action tap while signed out (or mid-onboarding) has nowhere
     * valid to route to yet — `create-page` isn't mounted outside `IsInApp` —
     * so the tap is dropped rather than queued. */
    useQuickActionCallback(useCallback((QuickAction: Action) =>
    {
        const DataSourceId = QuickAction.params?.dataSourceId;

        if (IsInApp && typeof DataSourceId === "string")
        {
            Router.push({
                params: { dataSourceId: DataSourceId },
                pathname: "/create-page"
            } as Href)();
        }
    }, [ IsInApp, Router ]));

    if (!Development.Active
        && (IsLoadingSession
            || IsLoadingActivity
            || (IsAuthenticated && IsLoadingConnection)))
    {
        /* Session and/or connection state is still resolving; render nothing to
         * avoid flashing the wrong stage. */
        return null;
    }

    return (
        <Stack screenOptions={ { headerShown: false } }>
            <Stack.Protected guard={ IsSignedOut }>
                <Stack.Screen name="sign-in" />
                <Stack.Screen
                    name="sign-in-modal-step-one"
                    options={ { presentation: "modal" } }
                />
                <Stack.Screen
                    name="sign-in-modal-step-two"
                    options={ { presentation: "modal" } }
                />
            </Stack.Protected>
            <Stack.Protected guard={ IsInOnboarding }>
                <Stack.Screen name="sync" />
                <Stack.Screen name="done" />
            </Stack.Protected>
            <Stack.Protected guard={ IsInApp }>
                <Stack.Screen name="index" />
                <Stack.Screen name="data-sources" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="account-settings" />
                <Stack.Screen
                    name="create-page"
                    options={ {
                        headerBackButtonDisplayMode: "minimal",
                        headerBackButtonMenuEnabled: false,
                        headerShown: true,
                        title: ""
                    } }
                />
            </Stack.Protected>
            <Stack.Protected guard={ CanAccessDatabaseConfiguration }>
                <Stack.Screen name="database-settings" />
                <Stack.Screen name="destination-config" />
            </Stack.Protected>
            <Stack.Protected guard={ __DEV__ }>
                <Stack.Screen name="onboarding-scenarios" />
                <Stack.Screen name="storybook" />
            </Stack.Protected>
        </Stack>
    );
}
