/**
 * @module notivex/app/_layout
 *
 * @file      _layout.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    DevelopmentOnboardingProvider,
    OnboardingMockRegistry,
    useDevelopmentOnboarding
} from "@/features/onboarding/onboarding-development";
import { NotivexAuthProvider, UseAuth } from "@/Domain/Auth/NotivexAuthProvider";
import { OnboardingProvider, useOnboarding } from "@/features/onboarding/onboarding-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider as NotivexThemeProvider } from "@notivex/ui";
import { RegisterDevelopmentMenu } from "@/Domain/Runtime/DevelopmentMenu";
import { Stack } from "expo-router";
import { StatusBar } from "@/Domain/Miscellaneous/StatusBar";
import { useEffect } from "react";

/**
 * The navigator, split out so it can read the auth and onboarding contexts
 * provided above it. The reachable routes are chosen from a stage derived purely
 * from `session + has-connection` (plus an in-memory "onboarding active" flag) —
 * nothing is persisted, so a returning user with a connection lands straight in
 * the app while a first-run user is walked through onboarding
 * (ArchitectureInitialDraft.md §5, §6).
 */
/* eslint-disable-next-line jsdoc/require-jsdoc */
function RootNavigator()
{
    /* The React Compiler otherwise memoizes this consumer so aggressively that
     * auth/onboarding context changes do not re-render it, stranding the app on
     * a blank gate. Opt out so stage transitions take effect. */
    "use no memo";

    const { IsLoading: IsLoadingSession, Session } = UseAuth();
    const { HasConnection, IsActive, IsLoadingConnection } = useOnboarding();
    const Development = useDevelopmentOnboarding();

    const IsAuthenticated = Session !== null;

    if (!Development.Active
        && (IsLoadingSession || (IsAuthenticated && IsLoadingConnection)))
    {
        /* Session and/or connection state is still resolving; render nothing to
         * avoid flashing the wrong stage. */
        return null;
    }

    /* Three mutually exclusive stages: signed out → welcome + sign-in; signed in
     * without a usable connection (or mid-flow) → grant/sync/done; signed in with
     * a connection → the app. */
    const MockStage = Development.Scenario === null
        ? null
        : OnboardingMockRegistry[Development.Scenario].Stage;
    const IsSignedOut = Development.Active
        ? MockStage === "SignedOut"
        : !IsAuthenticated;
    const IsInOnboarding = Development.Active
        ? MockStage === "Onboarding"
        : IsAuthenticated && (!HasConnection || IsActive);
    const IsInApp = !Development.Active
        && IsAuthenticated
        && HasConnection
        && !IsActive;

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
                <Stack.Screen name="grant" />
                <Stack.Screen name="sync" />
                <Stack.Screen name="done" />
            </Stack.Protected>
            <Stack.Protected guard={ IsInApp }>
                <Stack.Screen name="index" />
                <Stack.Screen name="data-sources" />
                <Stack.Screen name="destination-config" />
            </Stack.Protected>
            <Stack.Protected guard={ __DEV__ }>
                <Stack.Screen name="onboarding-scenarios" />
                <Stack.Screen name="storybook" />
            </Stack.Protected>
        </Stack>
    );
}

/** Mounts live providers while allowing the development mock to disable I/O. */
function RuntimeProviders()
{
    const Development = useDevelopmentOnboarding();

    return (
        <NotivexAuthProvider>
            <OnboardingProvider Enabled={ !Development.Active }>
                <RootNavigator />
            </OnboardingProvider>
        </NotivexAuthProvider>
    );
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
export default function RootLayout()
{
    useEffect(() =>
    {
        void RegisterDevelopmentMenu();
    }, [ ]);

    /* `NotivexThemeProvider` embeds React Navigation's `ThemeProvider` internally
     * (with the app-wide background bound to `Semantic.BackgroundMain`), so there
     * is deliberately no `expo-router` `ThemeProvider` mounted here. */
    return (
        <NotivexThemeProvider>
            <StatusBar />
            <GestureHandlerRootView style={ { flex: 1 } }>
                <BottomSheetModalProvider>
                    <DevelopmentOnboardingProvider>
                        <RuntimeProviders />
                    </DevelopmentOnboardingProvider>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </NotivexThemeProvider>
    );
}
