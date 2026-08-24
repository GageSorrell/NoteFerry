/**
 * @module notivex/app/_layout
 *
 * @file      _layout.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Notifications from "expo-notifications";
import type { Action } from "expo-quick-actions";
import type { Href } from "expo-router";
import { Stack, router } from "expo-router";
import { useCallback, useEffect } from "react";
import * as React from "react";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Function } from "@sorrell/effect";
import { ThemeProvider as NotivexThemeProvider, useTheme } from "@notivex/ui";
import { useQuickActionCallback } from "expo-quick-actions/hooks";
import { RegisterDevelopmentMenu } from "@/Domain/Runtime/DevelopmentMenu";
import { NotivexAuthProvider, useAuth } from "@/Domain/Auth/NotivexAuthProvider";
import { StatusBar } from "@/Domain/Miscellaneous/StatusBar";
import { SubscriptionProvider } from "@/Domain/Subscription";
import {
    DevelopmentOnboardingProvider,
    OnboardingMockRegistry,
    useDevelopmentOnboarding
} from "@/features/onboarding/onboarding-development";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { OnboardingProvider, useOnboarding } from "@/features/onboarding/onboarding-context";
import { useHighContrast } from "@/features/settings/use-high-contrast";

const HandledNotificationIds = new Set<string>();

const HandleNotificationResponse = (Response: Notifications.NotificationResponse): void =>
{
    const Identifier = Response.notification.request.identifier;
    if (HandledNotificationIds.has(Identifier))
    {
        return;
    }

    const CampaignId = Response.notification.request.content.data?.campaignId;
    if (typeof CampaignId !== "string")
    {
        return;
    }

    HandledNotificationIds.add(Identifier);
    router.push({ params: { campaignId: CampaignId }, pathname: "/subscribe" });
};

/**
 * Run application-scope registration functions. Quick actions are *not*
 * registered here — they depend on the current data sources and settings,
 * which are only available once signed in, so that runs from the navigator and
 * the home/settings screens instead.
 */
const useRootRegistration = () =>
{
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    useEffect(Function.AsVoid(RegisterDevelopmentMenu), [ ]);
    useEffect(() =>
    {
        void Notifications.getLastNotificationResponseAsync()
            .then((Response: Notifications.NotificationResponse | null
            ) =>
            {
                if (Response)
                {
                    HandleNotificationResponse(Response);
                }
            })
            .catch(() => undefined);
        const Subscription = Notifications.addNotificationResponseReceivedListener(
            HandleNotificationResponse
        );

        return Subscription.remove;
    }, [ ]);
};

/**
 * The various providers used across the application.
 *
 * @category Context
 * @since 1.0.0
 */
const Providers = ({ children }: React.PropsWithChildren): React.JSX.Element =>
{
    const Development = useDevelopmentOnboarding();
    const HighContrast = useHighContrast();

    return (
        <NotivexThemeProvider HighContrast={ HighContrast }>
            <StatusBar />
            <GestureHandlerRootView style={ { flex: 1 } }>
                <BottomSheetModalProvider>
                    <DevelopmentOnboardingProvider>
                        <NotivexAuthProvider>
                            <SubscriptionProvider>
                                <OnboardingProvider Enabled={ !Development.Active }>
                                    { children }
                                </OnboardingProvider>
                            </SubscriptionProvider>
                        </NotivexAuthProvider>
                    </DevelopmentOnboardingProvider>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </NotivexThemeProvider>
    );
};

/**
 * The navigator, split out so it can read the auth and onboarding contexts
 * provided above it. The reachable routes are chosen from a stage derived purely
 * from `session + has-connection` (plus an in-memory "onboarding active" flag) —
 * nothing is persisted, so a returning user with a connection lands straight in
 * the app while a first-run user is walked through onboarding.
 */
const RootNavigator = () =>
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
    const Theme = useTheme();

    const IsAuthenticated = Session !== null;
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
        return null;
    }

    return (
        <Stack screenOptions={ {
            headerShown: false,
            headerTitleAlign: "center",
            headerTitleStyle: {
                fontFamily: "Inter_600SemiBold",
                fontSize: 16,
                fontWeight: "600"
            }
        } }>
            <Stack.Protected guard={ IsSignedOut }>
                <Stack.Screen name="sign-in" />
                <Stack.Screen name="sign-in-modal"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundModal },
                        presentation: "modal",
                        title: "What’s Ahead: Two Steps"
                    } } />
            </Stack.Protected>
            <Stack.Protected guard={ IsInOnboarding }>
                <Stack.Screen name="sync" />
                <Stack.Screen name="enable-notifications" />
                <Stack.Screen name="done" />
            </Stack.Protected>
            <Stack.Protected guard={ IsInApp }>
                <Stack.Screen name="index" />
                <Stack.Screen name="data-sources" />
                <Stack.Screen name="settings"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: "Settings"
                    } } />
                <Stack.Screen name="general-settings"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: "General"
                    } } />
                <Stack.Screen name="notification-settings"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: "Notifications"
                    } } />
                <Stack.Screen name="quick-action-settings"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: "Quick Actions"
                    } } />
                <Stack.Screen name="workspace-settings"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: "Workspaces"
                    } } />
                <Stack.Screen name="account-settings" />
                <Stack.Screen name="feedback"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: ""
                    } } />
                <Stack.Screen name="create-page"
                    options={ {
                        headerBackButtonDisplayMode: "minimal",
                        headerBackButtonMenuEnabled: false,
                        headerShown: true,
                        title: ""
                    } } />
            </Stack.Protected>
            <Stack.Protected guard={ CanAccessDatabaseConfiguration }>
                <Stack.Screen name="plans"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: "Notivex Premium"
                    } } />
                <Stack.Screen name="subscribe"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: "Notivex Pro"
                    } } />
                <Stack.Screen name="database-settings"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: "Database settings"
                    } } />
                <Stack.Screen name="destination-config" />
            </Stack.Protected>
            <Stack.Protected guard={ __DEV__ }>
                <Stack.Screen name="onboarding-scenarios" />
                <Stack.Screen name="storybook" />
            </Stack.Protected>
        </Stack>
    );
};

const RootLayout = () =>
{
    useRootRegistration();

    return (
        <Providers>
            <RootNavigator />
        </Providers>
    );

};

export default RootLayout;
