/**
 * @module noteferry/app/_layout
 *
 * @file      _layout.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Notifications from "expo-notifications";
import * as React from "react";
import * as SplashScreen from "expo-splash-screen";
import { ActivityIndicator, View } from "react-native";
import {
    DevelopmentOnboardingProvider,
    OnboardingMockRegistry,
    useDevelopmentOnboarding
} from "@/features/onboarding/onboarding-development";
import { NoteFerryAuthProvider, useAuth } from "@/Domain/Auth/NoteFerryAuthProvider";
import { ThemeProvider as NoteFerryThemeProvider, useTheme } from "@noteferry/ui/Core";
import { OnboardingProvider, useOnboarding } from "@/features/onboarding/onboarding-context";
import { Stack, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import type { Action } from "expo-quick-actions";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Function } from "@sorrell/effect";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { Href } from "expo-router";
import { InitializeI18n, SyncCalendarLocales } from "@/Domain/Localization";
import { RegisterDevelopmentMenu } from "@/Domain/Runtime/DevelopmentMenu";
import { StatusBar } from "@/Domain/Miscellaneous/StatusBar";
import { SubscriptionProvider } from "@/Domain/Subscription";
import { useHighContrast } from "@/features/settings/use-high-contrast";
import { useLazyRouter } from "@/Domain/Utility/LazyRouter";
import { useQuickActionCallback } from "expo-quick-actions/hooks";
import { useTranslation } from "react-i18next";

void SplashScreen.preventAutoHideAsync();

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
        <NoteFerryThemeProvider HighContrast={ HighContrast }>
            <StatusBar />
            <GestureHandlerRootView style={ { flex: 1 } }>
                <BottomSheetModalProvider>
                    <DevelopmentOnboardingProvider>
                        <NoteFerryAuthProvider>
                            <SubscriptionProvider>
                                <OnboardingProvider Enabled={ !Development.Active }>
                                    { children }
                                </OnboardingProvider>
                            </SubscriptionProvider>
                        </NoteFerryAuthProvider>
                    </DevelopmentOnboardingProvider>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </NoteFerryThemeProvider>
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
    const { t } = useTranslation([ "settings", "common", "subscription", "onboarding" ]);

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
        return (
            <View
                accessibilityLabel={ t("common:loading") }
                style={ {
                    alignItems: "center",
                    backgroundColor: Theme.Semantic.BackgroundMain,
                    flex: 1,
                    justifyContent: "center"
                } }>
                <ActivityIndicator
                    color={ Theme.Semantic.Cursor }
                    size="large"
                />
            </View>
        );
    }

    return (
        <Stack screenOptions={ {
            headerShown: false,
            headerTitleAlign: "center",
            headerTitleStyle: {
                fontFamily: "Roboto Flex",
                fontSize: 16,
                fontWeight: "600"
            }
        } }>
            <Stack.Screen name="oauth-callback" />
            <Stack.Protected guard={ IsSignedOut }>
                <Stack.Screen name="sign-in" />
                <Stack.Screen name="sign-in-modal"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundModal },
                        presentation: "modal",
                        title: t("onboarding:titles.signInModal")
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
                        title: t("settings:titles.settings")
                    } } />
                <Stack.Screen name="general-settings"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: t("settings:titles.general")
                    } } />
                <Stack.Screen name="notification-settings"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: t("settings:titles.notifications")
                    } } />
                <Stack.Screen name="quick-action-settings"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: t("settings:titles.quickActions")
                    } } />
                <Stack.Screen name="workspace-settings"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: t("settings:titles.workspaces")
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
                        title: t("subscription:titles.plans")
                    } } />
                <Stack.Screen name="subscribe"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: t("subscription:titles.subscribe")
                    } } />
                <Stack.Screen name="database-settings"
                    options={ {
                        headerShown: true,
                        headerStyle: { backgroundColor: Theme.Semantic.BackgroundSidebar },
                        title: t("settings:titles.databaseSettings")
                    } } />
                <Stack.Screen name="destination-config" />
            </Stack.Protected>
            <Stack.Protected guard={ __DEV__ }>
                <Stack.Screen name="onboarding-scenarios" />
            </Stack.Protected>
        </Stack>
    );
};

const RootLayout = () =>
{
    const [ IsI18nReady, SetIsI18nReady ] = useState(false);

    useRootRegistration();

    useEffect(() =>
    {
        let Cancelled = false;

        void InitializeI18n()
            .catch((Error_: unknown) => console.error("i18n initialization failed:", Error_))
            .then(() =>
            {
                if (!Cancelled)
                {
                    SyncCalendarLocales();
                    SetIsI18nReady(true);
                    void SplashScreen.hideAsync();
                }
            });

        return () =>
        {
            Cancelled = true;
        };
    }, [ ]);

    if (!IsI18nReady)
    {
        return null;
    }

    return (
        <Providers>
            <RootNavigator />
        </Providers>
    );

};

export default RootLayout;
